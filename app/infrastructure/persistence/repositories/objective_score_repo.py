"""Objective score repository."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_score import ObjectiveScore


class ObjectiveScoreRepository:
    """Repository for ObjectiveScore entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def sum_weighted_score_for_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> Decimal:
        """Sum weighted_score of objective_scores for objectives in user/cycle."""
        result = await self._session.execute(
            select(
                func.coalesce(func.sum(ObjectiveScore.weighted_score), 0)
            )
            .select_from(ObjectiveScore)
            .join(Objective, Objective.id == ObjectiveScore.objective_id)
            .where(
                Objective.user_id == user_id,
                Objective.performance_cycle_id == performance_cycle_id,
            )
        )
        value = result.scalar_one()
        return Decimal("0") if value is None else Decimal(str(value))

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
        if score.locked:
            raise ValueError("Cannot recalculate a locked objective score")
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
