"""Performance cycle repository."""

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
