"""Performance dimension repository."""

from decimal import Decimal

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

    async def update(
        self,
        dimension_id: str,
        *,
        name: str | None = None,
        is_quantitative: bool | None = None,
        default_weight_pct: Decimal | None = None,
    ) -> PerformanceDimension | None:
        """Update dimension by id. Only provided fields updated. None if not found."""
        dim = await self.get_by_id(dimension_id)
        if dim is None:
            return None
        if name is not None:
            dim.name = name
        if is_quantitative is not None:
            dim.is_quantitative = is_quantitative
        if default_weight_pct is not None:
            dim.default_weight_pct = default_weight_pct
        await self._session.flush()
        await self._session.refresh(dim)
        return dim
