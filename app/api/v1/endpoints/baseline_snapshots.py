"""Baseline snapshot endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_baseline_snapshot_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.schemas.baseline_snapshot import (
    BaselineSnapshotCreate,
    BaselineSnapshotResponse,
)

router = APIRouter()


@router.get("", response_model=list[BaselineSnapshotResponse])
async def list_baseline_snapshots(
    user_id: str,
    performance_cycle_id: str,
    repo: Annotated[BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)],
) -> list[BaselineSnapshotResponse]:
    """List baseline snapshots for a user and performance cycle."""
    snapshots = await repo.list_by_user_cycle(user_id, performance_cycle_id)
    return [BaselineSnapshotResponse.model_validate(s) for s in snapshots]


@router.post("", response_model=BaselineSnapshotResponse, status_code=201)
async def create_baseline_snapshot(
    payload: BaselineSnapshotCreate,
    repo: Annotated[BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)],
) -> BaselineSnapshotResponse:
    """Create a baseline snapshot (immutable once created)."""
    snapshot = BaselineSnapshot(
        user_id=payload.user_id,
        performance_cycle_id=payload.performance_cycle_id,
        template_id=payload.template_id,
        baseline_value=payload.baseline_value,
        snapshot_date=payload.snapshot_date,
        data_source=payload.data_source,
    )
    snapshot = await repo.add(snapshot)
    return BaselineSnapshotResponse.model_validate(snapshot)


@router.get("/{id}", response_model=BaselineSnapshotResponse)
async def get_baseline_snapshot(
    id: str,
    repo: Annotated[BaselineSnapshotRepository, Depends(get_baseline_snapshot_repo)],
) -> BaselineSnapshotResponse:
    """Get one baseline snapshot by id."""
    snapshot = await repo.get_by_id(id)
    if snapshot is None:
        raise ResourceNotFoundException("BaselineSnapshot", id)
    return BaselineSnapshotResponse.model_validate(snapshot)
