"""Objective score repository."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective_score import ObjectiveScore


class ObjectiveScoreRepository:
    """Repository for ObjectiveScore entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_objective(self, objective_id: str) -> ObjectiveScore | None:
        """Return score for an objective (one-to-one)."""
        result = await self._session.execute(
            select(ObjectiveScore).where(ObjectiveScore.objective_id == objective_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, id: str) -> ObjectiveScore | None:
        """Return one score by id."""
        result = await self._session.execute(
            select(ObjectiveScore).where(ObjectiveScore.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, score: ObjectiveScore) -> ObjectiveScore:
        """Persist an objective score."""
        self._session.add(score)
        await self._session.flush()
        await self._session.refresh(score)
        return score

    async def update_calculated(
        self,
        score: ObjectiveScore,
        achievement_percentage: Decimal,
        weighted_score: Decimal,
        calculated_at: datetime,
    ) -> ObjectiveScore:
        """Update calculated fields (recalculation)."""
        score.achievement_percentage = achievement_percentage
        score.weighted_score = weighted_score
        score.calculated_at = calculated_at
        await self._session.flush()
        await self._session.refresh(score)
        return score

    async def set_locked(self, score: ObjectiveScore, locked: bool) -> ObjectiveScore:
        """Set score locked flag."""
        score.locked = locked
        await self._session.flush()
        await self._session.refresh(score)
        return score
