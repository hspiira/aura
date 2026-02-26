"""Behavioral indicator repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.behavioral_indicator import (
    BehavioralIndicator,
)
from app.infrastructure.persistence.persist import persist_and_refresh


class BehavioralIndicatorRepository:
    """Repository for BehavioralIndicator entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[BehavioralIndicator]:
        """Return all behavioral indicators."""
        result = await self._session.execute(
            select(BehavioralIndicator).order_by(BehavioralIndicator.name)
        )
        return list(result.scalars().all())

    async def list_by_dimension(self, dimension_id: str) -> list[BehavioralIndicator]:
        """Return indicators for a dimension."""
        result = await self._session.execute(
            select(BehavioralIndicator)
            .where(BehavioralIndicator.dimension_id == dimension_id)
            .order_by(BehavioralIndicator.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> BehavioralIndicator | None:
        """Return one indicator by id."""
        result = await self._session.execute(
            select(BehavioralIndicator).where(BehavioralIndicator.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, indicator: BehavioralIndicator) -> BehavioralIndicator:
        """Persist a behavioral indicator."""
        return await persist_and_refresh(self._session, indicator)
