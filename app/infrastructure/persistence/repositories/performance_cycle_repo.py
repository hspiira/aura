"""Performance cycle repository."""

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.performance_cycle import PerformanceCycle


class PerformanceCycleRepository:
    """Repository for PerformanceCycle entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[PerformanceCycle]:
        """Return all performance cycles."""
        result = await self._session.execute(
            select(PerformanceCycle).order_by(PerformanceCycle.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> PerformanceCycle | None:
        """Return one cycle by id."""
        result = await self._session.execute(
            select(PerformanceCycle).where(PerformanceCycle.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, cycle: PerformanceCycle) -> PerformanceCycle:
        """Persist a performance cycle."""
        self._session.add(cycle)
        await self._session.flush()
        await self._session.refresh(cycle)
        return cycle

    async def list_cycles_pending_objectives_lock(
        self, on_date: date
    ) -> list[PerformanceCycle]:
        """Return cycles where objectives_lock_date <= on_date and not yet locked."""
        result = await self._session.execute(
            select(PerformanceCycle).where(
                PerformanceCycle.objectives_lock_date.isnot(None),
                PerformanceCycle.objectives_lock_date <= on_date,
                PerformanceCycle.objectives_locked_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def set_objectives_locked_at(
        self, cycle: PerformanceCycle, locked_at: datetime
    ) -> PerformanceCycle:
        """Mark cycle as having run objectives lock job."""
        cycle.objectives_locked_at = locked_at
        await self._session.flush()
        await self._session.refresh(cycle)
        return cycle
