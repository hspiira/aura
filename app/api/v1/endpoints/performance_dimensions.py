"""Performance dimension endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_performance_dimension_repo, require_permission
from app.domain.exceptions import ResourceNotFoundException
from app.domain.permissions import MANAGE_DIMENSIONS
from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)
from app.infrastructure.persistence.repositories.performance_dimension_repo import (
    PerformanceDimensionRepository,
)
from app.schemas.performance_dimension import (
    PerformanceDimensionCreate,
    PerformanceDimensionResponse,
    PerformanceDimensionUpdate,
)

router = APIRouter()


@router.get("", response_model=list[PerformanceDimensionResponse])
async def list_performance_dimensions(
    repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
) -> list[PerformanceDimensionResponse]:
    """List all performance dimensions."""
    dims = await repo.list_all()
    return [PerformanceDimensionResponse.model_validate(d) for d in dims]


@router.post("", response_model=PerformanceDimensionResponse, status_code=201)
async def create_performance_dimension(
    payload: PerformanceDimensionCreate,
    repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(MANAGE_DIMENSIONS))],
) -> PerformanceDimensionResponse:
    """Create a performance dimension."""
    dim = PerformanceDimension(
        name=payload.name,
        is_quantitative=payload.is_quantitative,
        default_weight_pct=payload.default_weight_pct,
    )
    dim = await repo.add(dim)
    return PerformanceDimensionResponse.model_validate(dim)


@router.patch("/{id}", response_model=PerformanceDimensionResponse)
async def update_performance_dimension(
    id: str,
    payload: PerformanceDimensionUpdate,
    repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(MANAGE_DIMENSIONS))],
) -> PerformanceDimensionResponse:
    """Update a performance dimension (partial)."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        dim = await repo.get_by_id(id)
        if dim is None:
            raise ResourceNotFoundException("PerformanceDimension", id)
        return PerformanceDimensionResponse.model_validate(dim)
    dim = await repo.update(id, **updates)
    if dim is None:
        raise ResourceNotFoundException("PerformanceDimension", id)
    return PerformanceDimensionResponse.model_validate(dim)


@router.get("/{id}", response_model=PerformanceDimensionResponse)
async def get_performance_dimension(
    id: str,
    repo: Annotated[
        PerformanceDimensionRepository, Depends(get_performance_dimension_repo)
    ],
) -> PerformanceDimensionResponse:
    """Get one performance dimension by id."""
    dim = await repo.get_by_id(id)
    if dim is None:
        raise ResourceNotFoundException("PerformanceDimension", id)
    return PerformanceDimensionResponse.model_validate(dim)
