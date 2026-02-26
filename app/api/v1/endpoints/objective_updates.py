"""Objective update (progress) endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_objective_update_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.objective_update import ObjectiveUpdate
from app.infrastructure.persistence.repositories.objective_update_repo import (
    ObjectiveUpdateRepository,
)
from app.schemas.objective_update import (
    ObjectiveUpdateCreate,
    ObjectiveUpdateResponse,
)

router = APIRouter()


@router.get("", response_model=list[ObjectiveUpdateResponse])
async def list_updates_for_objective(
    objective_id: str,
    repo: Annotated[ObjectiveUpdateRepository, Depends(get_objective_update_repo)],
) -> list[ObjectiveUpdateResponse]:
    """List progress updates for an objective."""
    updates = await repo.list_by_objective(objective_id)
    return [ObjectiveUpdateResponse.model_validate(u) for u in updates]


@router.post("", response_model=ObjectiveUpdateResponse, status_code=201)
async def create_objective_update(
    payload: ObjectiveUpdateCreate,
    repo: Annotated[ObjectiveUpdateRepository, Depends(get_objective_update_repo)],
) -> ObjectiveUpdateResponse:
    """Create a progress update for an objective."""
    update = ObjectiveUpdate(
        objective_id=payload.objective_id,
        actual_value=payload.actual_value,
        comment=payload.comment,
        submitted_by=payload.submitted_by,
    )
    update = await repo.add(update)
    return ObjectiveUpdateResponse.model_validate(update)


@router.get("/{id}", response_model=ObjectiveUpdateResponse)
async def get_objective_update(
    id: str,
    repo: Annotated[ObjectiveUpdateRepository, Depends(get_objective_update_repo)],
) -> ObjectiveUpdateResponse:
    """Get one objective update by id."""
    update = await repo.get_by_id(id)
    if update is None:
        raise ResourceNotFoundException("ObjectiveUpdate", id)
    return ObjectiveUpdateResponse.model_validate(update)
