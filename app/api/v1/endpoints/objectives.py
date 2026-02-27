"""Objective endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_baseline_snapshot_repo,
    get_notification_log_repo,
    get_notification_rule_repo,
    get_objective_repo,
    get_objective_score_repo,
    get_objective_template_repo,
    get_objective_update_repo,
    get_objective_version_repo,
    get_performance_cycle_repo,
    get_performance_dimension_repo,
    get_user_repo,
    require_permission,
)
from app.api.v1.helpers import get_one_or_raise
from app.application.notification_service import emit_event
from app.application.objective_validation import run_smart_validation
from app.core.auth import CurrentUserIdOptional
from app.domain.exceptions import (
    TransitionViolationException,
    ValidationException,
)
from app.domain.objective import ObjectiveStatus, can_transition
from app.domain.permissions import APPROVE_OBJECTIVES, EDIT_OBJECTIVES
from app.domain.scoring import compute_score
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_score import ObjectiveScore
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.infrastructure.persistence.repositories.notification_log_repo import (
    NotificationLogRepository,
)
from app.infrastructure.persistence.repositories.notification_rule_repo import (
    NotificationRuleRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.infrastructure.persistence.repositories.objective_update_repo import (
    ObjectiveUpdateRepository,
)
from app.infrastructure.persistence.repositories.objective_version_repo import (
    ObjectiveVersionRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.infrastructure.persistence.repositories.performance_dimension_repo import (
    PerformanceDimensionRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.schemas.objective import (
    ObjectiveAmend,
    ObjectiveCreate,
    ObjectiveResponse,
    ObjectiveUpdateStatus,
)
from app.schemas.objective_score import ObjectiveScoreResponse
from app.schemas.objective_validation import (
    ValidateObjectiveRequest,
    ValidateObjectiveResponse,
)
from app.shared.utils.datetime import utc_now

router = APIRouter()


@router.get("", response_model=list[ObjectiveResponse])
async def list_objectives(
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
) -> list[ObjectiveResponse]:
    """List all objectives."""
    objectives = await repo.list_all()
    return [ObjectiveResponse.model_validate(o) for o in objectives]


@router.post("", response_model=ObjectiveResponse, status_code=201)
async def create_objective(
    payload: ObjectiveCreate,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(EDIT_OBJECTIVES))],
) -> ObjectiveResponse:
    """Create an objective (status draft)."""
    objective = Objective(
        user_id=payload.user_id,
        performance_cycle_id=payload.performance_cycle_id,
        dimension_id=payload.dimension_id,
        template_id=payload.template_id,
        title=payload.title,
        description=payload.description,
        kpi_type=payload.kpi_type,
        target_value=payload.target_value,
        unit_of_measure=payload.unit_of_measure,
        weight=payload.weight,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    objective = await repo.add(objective)
    await audit_repo.add(
        entity_type="objective",
        entity_id=objective.id,
        action="create",
        new_value={"title": objective.title, "status": objective.status},
        changed_by=changed_by,
    )
    return ObjectiveResponse.model_validate(objective)


def _parse_status(value: str, default: ObjectiveStatus | None) -> ObjectiveStatus:
    """Parse status string; return default if invalid, else raise when default None."""
    try:
        return ObjectiveStatus(value.lower())
    except ValueError:
        if default is not None:
            return default
        raise TransitionViolationException(
            f"Invalid status: {value}", "", value
        ) from None


@router.get("/{id}", response_model=ObjectiveResponse)
async def get_objective(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
) -> ObjectiveResponse:
    """Get one objective by id."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    return ObjectiveResponse.model_validate(objective)


@router.post("/validate", response_model=ValidateObjectiveResponse)
async def validate_objective_by_id(
    payload: ValidateObjectiveRequest,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    cycle_repo: Annotated[
        PerformanceCycleRepository, Depends(get_performance_cycle_repo)
    ],
    template_repo: Annotated[
        ObjectiveTemplateRepository, Depends(get_objective_template_repo)
    ],
    baseline_repo: Annotated[
        BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)
    ],
    dimension_repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
) -> ValidateObjectiveResponse:
    """Run SMART validation for an existing objective."""
    objective = await get_one_or_raise(
        repo.get_by_id(payload.objective_id),
        payload.objective_id,
        "Objective",
    )
    return await run_smart_validation(
        objective,
        cycle_repo,
        template_repo,
        repo,
        baseline_repo,
        dimension_repo,
    )


@router.patch("/{id}/amend", response_model=ObjectiveResponse)
async def amend_objective(
    id: str,
    payload: ObjectiveAmend,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    version_repo: Annotated[
        ObjectiveVersionRepository, Depends(get_objective_version_repo)
    ],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    cycle_repo: Annotated[
        PerformanceCycleRepository, Depends(get_performance_cycle_repo)
    ],
    template_repo: Annotated[
        ObjectiveTemplateRepository, Depends(get_objective_template_repo)
    ],
    baseline_repo: Annotated[
        BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)
    ],
    dimension_repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(EDIT_OBJECTIVES))],
) -> ObjectiveResponse:
    """Amend an objective's target/weight with versioned history."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    if objective.locked_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Objective is locked; cannot be amended.",
        )

    current_status = _parse_status(objective.status, ObjectiveStatus.DRAFT)
    if current_status not in {
        ObjectiveStatus.APPROVED,
        ObjectiveStatus.ACTIVE,
    }:
        raise HTTPException(
            status_code=400,
            detail="Only approved or active objectives can be amended.",
        )

    existing_versions = await version_repo.list_by_objective(objective.id)
    next_version = existing_versions[-1].version + 1 if existing_versions else 1

    now = utc_now()
    await version_repo.add_from_objective(
        objective=objective,
        version=next_version,
        justification=payload.justification,
        amended_by=changed_by,
        amended_at=now,
    )

    if payload.target_value is not None:
        objective.target_value = payload.target_value
    if payload.weight is not None:
        objective.weight = payload.weight

    validation = await run_smart_validation(
        objective,
        cycle_repo,
        template_repo,
        repo,
        baseline_repo,
        dimension_repo,
        last_achievement_value=None,
        justification_for_lower_target=payload.justification,
    )
    if not validation.valid:
        raise ValidationException(
            "SMART validation failed for amendment",
            errors=validation.errors,
        )

    objective = await repo.refresh(objective)
    await audit_repo.add(
        entity_type="objective",
        entity_id=objective.id,
        action="amend",
        new_value={
            "target_value": (
                str(objective.target_value)
                if objective.target_value is not None
                else None
            ),
            "weight": str(objective.weight),
            "justification": payload.justification,
            "version": next_version,
        },
        changed_by=changed_by,
    )
    return ObjectiveResponse.model_validate(objective)


@router.patch("/{id}/status", response_model=ObjectiveResponse)
async def update_objective_status(
    id: str,
    payload: ObjectiveUpdateStatus,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    cycle_repo: Annotated[
        PerformanceCycleRepository, Depends(get_performance_cycle_repo)
    ],
    template_repo: Annotated[
        ObjectiveTemplateRepository, Depends(get_objective_template_repo)
    ],
    baseline_repo: Annotated[
        BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)
    ],
    dimension_repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(EDIT_OBJECTIVES))],
) -> ObjectiveResponse:
    """Transition objective status (lifecycle + SMART when submitting)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    if objective.locked_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Objective is locked; cannot change status.",
        )
    from_status = _parse_status(objective.status, ObjectiveStatus.DRAFT)
    to_status = _parse_status(payload.status, None)
    if not can_transition(from_status, to_status):
        raise TransitionViolationException(
            f"Cannot transition from {from_status.value} to {to_status.value}",
            from_status.value,
            to_status.value,
        )
    if to_status == ObjectiveStatus.SUBMITTED:
        validation = await run_smart_validation(
            objective,
            cycle_repo,
            template_repo,
            repo,
            baseline_repo,
            dimension_repo,
        )
        if not validation.valid:
            raise ValidationException(
                "SMART validation failed",
                errors=validation.errors,
            )
    old_status = objective.status
    objective = await repo.update_status(objective, to_status.value)
    await audit_repo.add(
        entity_type="objective",
        entity_id=objective.id,
        action="status_change",
        old_value={"status": old_status},
        new_value={"status": objective.status},
        changed_by=changed_by,
    )
    return ObjectiveResponse.model_validate(objective)


@router.post("/{id}/calculate-score", response_model=ObjectiveScoreResponse)
async def calculate_objective_score(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    update_repo: Annotated[
        ObjectiveUpdateRepository, Depends(get_objective_update_repo)
    ],
    score_repo: Annotated[ObjectiveScoreRepository, Depends(get_objective_score_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(EDIT_OBJECTIVES))],
) -> ObjectiveScoreResponse:
    """Compute and persist score for an objective (latest update actual or 0)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    if objective.locked_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Objective is locked.",
        )
    updates = await update_repo.list_by_objective(id)
    actual_value = None
    if updates and updates[0].actual_value is not None:
        actual_value = updates[0].actual_value
    target_value = objective.target_value
    weight = objective.weight
    result = compute_score(
        target_value=target_value,
        actual_value=actual_value,
        weight=weight,
    )
    now = utc_now()
    existing = await score_repo.get_by_objective(id)
    if existing:
        score = await score_repo.update_calculated(
            existing,
            result.achievement_percentage,
            result.weighted_score,
            now,
        )
    else:
        score = ObjectiveScore(
            objective_id=id,
            achievement_percentage=result.achievement_percentage,
            weighted_score=result.weighted_score,
            calculated_at=now,
            locked=False,
        )
        score = await score_repo.add(score)
    await audit_repo.add(
        entity_type="objective_score",
        entity_id=score.id,
        action="calculate",
        new_value={
            "objective_id": id,
            "achievement_percentage": str(result.achievement_percentage),
        },
        changed_by=changed_by,
    )
    return ObjectiveScoreResponse.model_validate(score)


@router.post("/{id}/lock", response_model=ObjectiveResponse)
async def lock_objective(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    score_repo: Annotated[ObjectiveScoreRepository, Depends(get_objective_score_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    notification_rule_repo: Annotated[
        NotificationRuleRepository, Depends(get_notification_rule_repo)
    ],
    notification_log_repo: Annotated[
        NotificationLogRepository, Depends(get_notification_log_repo)
    ],
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    _perm: Annotated[None, Depends(require_permission(APPROVE_OBJECTIVES))],
) -> ObjectiveResponse:
    """Lock objective and its score (no further edits; score immutable)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    if objective.locked_at is not None:
        return ObjectiveResponse.model_validate(objective)
    score = await score_repo.get_by_objective(id)
    now = utc_now()
    objective = await repo.set_locked_at(objective, now)
    if score is not None and not score.locked:
        await score_repo.set_locked(score, locked=True)
    await audit_repo.add(
        entity_type="objective",
        entity_id=objective.id,
        action="lock",
        new_value={"locked_at": now.isoformat()},
        changed_by=changed_by,
    )
    await emit_event(
        event_type="objective_locked",
        context={
            "objective_id": objective.id,
            "user_id": objective.user_id,
            "performance_cycle_id": objective.performance_cycle_id,
        },
        rule_repo=notification_rule_repo,
        log_repo=notification_log_repo,
        user_repo=user_repo,
    )
    return ObjectiveResponse.model_validate(objective)
