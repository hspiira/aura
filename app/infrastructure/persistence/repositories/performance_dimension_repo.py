"""Performance dimension repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)


class PerformanceDimensionRepository:
    """Repository for PerformanceDimension entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[PerformanceDimension]:
        """Return all performance dimensions."""
        result = await self._session.execute(
            select(PerformanceDimension).order_by(PerformanceDimension.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> PerformanceDimension | None:
        """Return one dimension by id."""
        result = await self._session.execute(
            select(PerformanceDimension).where(PerformanceDimension.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, dimension: PerformanceDimension) -> PerformanceDimension:
        """Persist a performance dimension."""
        self._session.add(dimension)
        await self._session.flush()
        await self._session.refresh(dimension)
        return dimension
