"""Objective endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_baseline_snapshot_repo,
    get_objective_repo,
    get_objective_score_repo,
    get_objective_template_repo,
    get_objective_update_repo,
    get_performance_cycle_repo,
)
from app.api.v1.helpers import get_one_or_raise
from app.application.objective_validation import run_smart_validation
from app.domain.exceptions import (
    ResourceNotFoundException,
    TransitionViolationException,
    ValidationException,
)
from app.domain.objective import ObjectiveStatus, can_transition
from app.domain.scoring import compute_score
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_score import ObjectiveScore
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
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
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.schemas.objective_validation import (
    ValidateObjectiveRequest,
    ValidateObjectiveResponse,
)
from app.schemas.objective import (
    ObjectiveCreate,
    ObjectiveResponse,
    ObjectiveUpdateStatus,
)
from app.schemas.objective_score import ObjectiveScoreResponse
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
    )
    return ObjectiveResponse.model_validate(objective)


def _parse_status(value: str, default: ObjectiveStatus | None) -> ObjectiveStatus:
    """Parse status string; return default if invalid, else raise when default is None."""
    try:
        return ObjectiveStatus(value.lower())
    except ValueError:
        if default is not None:
            return default
        raise TransitionViolationException(
            f"Invalid status: {value}", "", value
        )


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
) -> ValidateObjectiveResponse:
    """Run SMART validation for an existing objective."""
    objective = await get_one_or_raise(
        repo.get_by_id(payload.objective_id),
        payload.objective_id,
        "Objective",
    )
    return await run_smart_validation(
        objective, cycle_repo, template_repo, repo, baseline_repo
    )


@router.patch("/{id}/status", response_model=ObjectiveResponse)
async def update_objective_status(
    id: str,
    payload: ObjectiveUpdateStatus,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    cycle_repo: Annotated[
        PerformanceCycleRepository, Depends(get_performance_cycle_repo)
    ],
    template_repo: Annotated[
        ObjectiveTemplateRepository, Depends(get_objective_template_repo)
    ],
    baseline_repo: Annotated[
        BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)
    ],
) -> ObjectiveResponse:
    """Transition objective status (lifecycle + SMART when submitting)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
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
            objective, cycle_repo, template_repo, repo, baseline_repo
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
    )
    return ObjectiveResponse.model_validate(objective)


@router.post("/{id}/calculate-score", response_model=ObjectiveScoreResponse)
async def calculate_objective_score(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    update_repo: Annotated[
        ObjectiveUpdateRepository, Depends(get_objective_update_repo)
    ],
    score_repo: Annotated[
        ObjectiveScoreRepository, Depends(get_objective_score_repo)
    ],
) -> ObjectiveScoreResponse:
    """Compute and persist score for an objective (latest update actual or 0)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
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
    return ObjectiveScoreResponse.model_validate(score)


@router.post("/{id}/lock", response_model=ObjectiveResponse)
async def lock_objective(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    score_repo: Annotated[
        ObjectiveScoreRepository, Depends(get_objective_score_repo)
    ],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
) -> ObjectiveResponse:
    """Lock objective and its score (no further edits; score immutable)."""
    objective = await get_one_or_raise(repo.get_by_id(id), id, "Objective")
    if objective.locked_at is not None:
        return ObjectiveResponse.model_validate(objective)
    score = await score_repo.get_by_objective(id)
    now = utc_now()
    objective = await repo.set_locked_at(objective, now)
    if score is not None and not score.locked:
        await score_repo.set_locked(score, True)
    await audit_repo.add(
        entity_type="objective",
        entity_id=objective.id,
        action="lock",
        new_value={"locked_at": now.isoformat()},
    )
    return ObjectiveResponse.model_validate(objective)
