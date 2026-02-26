"""Reward policy repository."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.reward_policy import RewardPolicy
from app.infrastructure.persistence.persist import persist_and_refresh


class RewardPolicyRepository:
    """Repository for RewardPolicy entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[RewardPolicy]:
        """Return all reward policies."""
        result = await self._session.execute(
            select(RewardPolicy).order_by(RewardPolicy.min_score.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> RewardPolicy | None:
        """Return one policy by id."""
        result = await self._session.execute(
            select(RewardPolicy).where(RewardPolicy.id == id)
        )
        return result.scalar_one_or_none()

    async def find_band_for_score(
        self, score: Decimal
    ) -> RewardPolicy | None:
        """Return the policy band that contains the given score (min_score <= score <= max_score)."""
        result = await self._session.execute(
            select(RewardPolicy).where(
                RewardPolicy.min_score <= score,
                RewardPolicy.max_score >= score,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, policy: RewardPolicy) -> RewardPolicy:
        """Persist a reward policy."""
        return await persist_and_refresh(self._session, policy)
