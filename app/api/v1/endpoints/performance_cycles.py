"""Performance cycle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_performance_cycle_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.performance_cycle import PerformanceCycle
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.schemas.performance_cycle import (
    PerformanceCycleCreate,
    PerformanceCycleResponse,
)

router = APIRouter()


@router.get("", response_model=list[PerformanceCycleResponse])
async def list_performance_cycles(
    repo: Annotated[PerformanceCycleRepository, Depends(get_performance_cycle_repo)],
) -> list[PerformanceCycleResponse]:
    """List all performance cycles."""
    cycles = await repo.list_all()
    return [PerformanceCycleResponse.model_validate(c) for c in cycles]


@router.post("", response_model=PerformanceCycleResponse, status_code=201)
async def create_performance_cycle(
    payload: PerformanceCycleCreate,
    repo: Annotated[PerformanceCycleRepository, Depends(get_performance_cycle_repo)],
) -> PerformanceCycleResponse:
    """Create a performance cycle."""
    cycle = PerformanceCycle(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status,
        review_frequency=payload.review_frequency,
    )
    cycle = await repo.add(cycle)
    return PerformanceCycleResponse.model_validate(cycle)


@router.get("/{id}", response_model=PerformanceCycleResponse)
async def get_performance_cycle(
    id: str,
    repo: Annotated[PerformanceCycleRepository, Depends(get_performance_cycle_repo)],
) -> PerformanceCycleResponse:
    """Get one performance cycle by id."""
    cycle = await repo.get_by_id(id)
    if cycle is None:
        raise ResourceNotFoundException("PerformanceCycle", id)
    return PerformanceCycleResponse.model_validate(cycle)
