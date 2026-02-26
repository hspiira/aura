"""Behavioral score repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
from app.infrastructure.persistence.persist import persist_and_refresh


class BehavioralScoreRepository:
    """Repository for BehavioralScore entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[BehavioralScore]:
        """Return all behavioral scores."""
        result = await self._session.execute(
            select(BehavioralScore).order_by(
                BehavioralScore.user_id,
                BehavioralScore.performance_cycle_id,
                BehavioralScore.created_at.desc(),
            )
        )
        return list(result.scalars().all())

    async def list_by_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> list[BehavioralScore]:
        """Return scores for a user and performance cycle."""
        result = await self._session.execute(
            select(BehavioralScore)
            .where(
                BehavioralScore.user_id == user_id,
                BehavioralScore.performance_cycle_id == performance_cycle_id,
            )
            .order_by(BehavioralScore.indicator_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> BehavioralScore | None:
        """Return one score by id."""
        result = await self._session.execute(
            select(BehavioralScore).where(BehavioralScore.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, score: BehavioralScore) -> BehavioralScore:
        """Persist a behavioral score."""
        return await persist_and_refresh(self._session, score)
