"""Objective endpoints."""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_baseline_snapshot_repo,
    get_objective_repo,
    get_objective_template_repo,
    get_performance_cycle_repo,
)
from app.domain.exceptions import (
    ResourceNotFoundException,
    TransitionViolationException,
    ValidationException,
)
from app.domain.objective import ObjectiveStatus, can_transition
from app.domain.smart_validation import (
    has_baseline_for_user_cycle_template,
    validate_objective,
)
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.schemas.baseline_snapshot import (
    ValidateObjectiveRequest,
    ValidateObjectiveResponse,
)
from app.schemas.objective import (
    ObjectiveCreate,
    ObjectiveResponse,
    ObjectiveUpdateStatus,
)

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


async def _run_smart_validation(
    objective: Objective,
    cycle_repo: PerformanceCycleRepository,
    template_repo: ObjectiveTemplateRepository,
    objective_repo: ObjectiveRepository,
    baseline_repo: BaselineSnapshotRepository,
) -> ValidateObjectiveResponse:
    """Load cycle, template, other objectives, baselines; run SMART validation."""
    cycle = await cycle_repo.get_by_id(objective.performance_cycle_id)
    if not cycle:
        return ValidateObjectiveResponse(
            valid=False,
            errors=["performance cycle not found"],
        )
    template = None
    if objective.template_id:
        template = await template_repo.get_by_id(objective.template_id)
    others = await objective_repo.list_by_cycle(objective.performance_cycle_id)
    other_weights = sum(
        o.weight
        for o in others
        if o.user_id == objective.user_id and o.id != objective.id
    )
    baselines = await baseline_repo.list_by_user_cycle(
        objective.user_id, objective.performance_cycle_id
    )
    has_baseline = True
    if template and template.requires_baseline_snapshot and objective.template_id:
        has_baseline = has_baseline_for_user_cycle_template(
            baselines,
            objective.user_id,
            objective.performance_cycle_id,
            objective.template_id,
        )
    result = validate_objective(
        title=objective.title,
        kpi_type=objective.kpi_type,
        target_value=objective.target_value,
        weight=objective.weight,
        start_date=objective.start_date,
        end_date=objective.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal(str(other_weights)),
        has_baseline_for_template=has_baseline,
    )
    return ValidateObjectiveResponse(valid=result.valid, errors=result.errors)


@router.get("/{id}", response_model=ObjectiveResponse)
async def get_objective(
    id: str,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
) -> ObjectiveResponse:
    """Get one objective by id."""
    objective = await repo.get_by_id(id)
    if objective is None:
        raise ResourceNotFoundException("Objective", id)
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
    objective = await repo.get_by_id(payload.objective_id)
    if objective is None:
        raise ResourceNotFoundException("Objective", payload.objective_id)
    return await _run_smart_validation(
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
    objective = await repo.get_by_id(id)
    if objective is None:
        raise ResourceNotFoundException("Objective", id)
    try:
        from_status = ObjectiveStatus(objective.status)
    except ValueError:
        from_status = ObjectiveStatus.DRAFT
    try:
        to_status = ObjectiveStatus(payload.status.lower())
    except ValueError:
        raise TransitionViolationException(
            f"Invalid status: {payload.status}",
            objective.status,
            payload.status,
        )
    if not can_transition(from_status, to_status):
        raise TransitionViolationException(
            f"Cannot transition from {from_status.value} to {to_status.value}",
            from_status.value,
            to_status.value,
        )
    if to_status == ObjectiveStatus.SUBMITTED:
        validation = await _run_smart_validation(
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
