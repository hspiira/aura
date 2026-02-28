"""Performance cycle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_notification_outbox_repo,
    get_objective_repo,
    get_objective_score_repo,
    get_performance_cycle_repo,
    require_permission,
)
from app.domain.exceptions import ResourceNotFoundException
from app.domain.permissions import MANAGE_CYCLES
from app.infrastructure.persistence.models.performance_cycle import PerformanceCycle
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.notification_outbox_repo import (
    NotificationOutboxRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.schemas.performance_cycle import (
    PerformanceCycleCreate,
    PerformanceCycleResponse,
    PerformanceCycleUpdate,
)
from app.shared.utils.datetime import utc_now

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
    _perm: Annotated[None, Depends(require_permission(MANAGE_CYCLES))],
) -> PerformanceCycleResponse:
    """Create a performance cycle."""
    cycle = PerformanceCycle(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status,
        review_frequency=payload.review_frequency,
        objectives_lock_date=payload.objectives_lock_date,
    )
    cycle = await repo.add(cycle)
    return PerformanceCycleResponse.model_validate(cycle)


@router.patch("/{id}", response_model=PerformanceCycleResponse)
async def update_performance_cycle(
    id: str,
    payload: PerformanceCycleUpdate,
    repo: Annotated[PerformanceCycleRepository, Depends(get_performance_cycle_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_CYCLES))],
) -> PerformanceCycleResponse:
    """Update a performance cycle (partial)."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        cycle = await repo.get_by_id(id)
        if cycle is None:
            raise ResourceNotFoundException("PerformanceCycle", id)
        return PerformanceCycleResponse.model_validate(cycle)
    cycle = await repo.update(id, **updates)
    if cycle is None:
        raise ResourceNotFoundException("PerformanceCycle", id)
    return PerformanceCycleResponse.model_validate(cycle)


@router.post("/{id}/lock-objectives", response_model=PerformanceCycleResponse)
async def lock_cycle_objectives(
    id: str,
    repo: Annotated[PerformanceCycleRepository, Depends(get_performance_cycle_repo)],
    objective_repo: Annotated[ObjectiveRepository, Depends(get_objective_repo)],
    score_repo: Annotated[ObjectiveScoreRepository, Depends(get_objective_score_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    outbox_repo: Annotated[
        NotificationOutboxRepository, Depends(get_notification_outbox_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(MANAGE_CYCLES))],
) -> PerformanceCycleResponse:
    """Lock all unlocked objectives for this cycle and set objectives_locked_at."""
    cycle = await repo.get_by_id(id)
    if cycle is None:
        raise ResourceNotFoundException("PerformanceCycle", id)
    objectives = await objective_repo.list_by_cycle(id)
    to_lock = [o for o in objectives if o.locked_at is None]
    now = utc_now()
    for obj in to_lock:
        await objective_repo.set_locked_at(obj, now)
        score = await score_repo.get_by_objective(obj.id)
        if score is not None and not score.locked:
            await score_repo.set_locked(score, locked=True)
        await audit_repo.add(
            entity_type="objective",
            entity_id=obj.id,
            action="lock",
            new_value={"locked_at": now.isoformat()},
            changed_by=None,
        )
    cycle = await repo.set_objectives_locked_at(cycle, now)
    if to_lock:
        await outbox_repo.add(
            event_type="objective_locked",
            context={
                "performance_cycle_id": id,
                "objective_ids": [o.id for o in to_lock],
                "count": len(to_lock),
            },
        )
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
