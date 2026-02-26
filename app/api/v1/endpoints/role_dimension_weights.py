"""Role dimension weight endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_role_dimension_weight_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)
from app.infrastructure.persistence.repositories.role_dimension_weight_repo import (
    RoleDimensionWeightRepository,
)
from app.schemas.role_dimension_weight import (
    RoleDimensionWeightCreate,
    RoleDimensionWeightResponse,
)

router = APIRouter()


@router.get("", response_model=list[RoleDimensionWeightResponse])
async def list_role_dimension_weights(
    repo: Annotated[
        RoleDimensionWeightRepository, Depends(get_role_dimension_weight_repo)
    ],
) -> list[RoleDimensionWeightResponse]:
    """List all role dimension weights."""
    weights = await repo.list_all()
    return [RoleDimensionWeightResponse.model_validate(w) for w in weights]


@router.post("", response_model=RoleDimensionWeightResponse, status_code=201)
async def create_role_dimension_weight(
    payload: RoleDimensionWeightCreate,
    repo: Annotated[
        RoleDimensionWeightRepository, Depends(get_role_dimension_weight_repo)
    ],
) -> RoleDimensionWeightResponse:
    """Create a role dimension weight."""
    weight = RoleDimensionWeight(
        role_id=payload.role_id,
        dimension_id=payload.dimension_id,
        weight_pct=payload.weight_pct,
    )
    weight = await repo.add(weight)
    return RoleDimensionWeightResponse.model_validate(weight)


@router.get("/{id}", response_model=RoleDimensionWeightResponse)
async def get_role_dimension_weight(
    id: str,
    repo: Annotated[
        RoleDimensionWeightRepository, Depends(get_role_dimension_weight_repo)
    ],
) -> RoleDimensionWeightResponse:
    """Get one role dimension weight by id."""
    weight = await repo.get_by_id(id)
    if weight is None:
        raise ResourceNotFoundException("RoleDimensionWeight", id)
    return RoleDimensionWeightResponse.model_validate(weight)
