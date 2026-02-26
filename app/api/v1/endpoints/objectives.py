"""Objective endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_audit_log_repo, get_objective_repo
from app.domain.exceptions import (
    ResourceNotFoundException,
    TransitionViolationException,
)
from app.domain.objective import ObjectiveStatus, can_transition
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
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


@router.patch("/{id}/status", response_model=ObjectiveResponse)
async def update_objective_status(
    id: str,
    payload: ObjectiveUpdateStatus,
    repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
) -> ObjectiveResponse:
    """Transition objective status (validated against lifecycle)."""
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
