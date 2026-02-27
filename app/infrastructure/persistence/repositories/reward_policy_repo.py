"""Reward policy repository."""

import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.reward_policy import RewardPolicy
from app.infrastructure.persistence.persist import persist_and_refresh

logger = logging.getLogger(__name__)


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

    async def find_band_for_score(self, score: Decimal) -> RewardPolicy | None:
        """Return the policy band that contains the given score (min_score <= score <= max_score).
        If multiple bands overlap, returns the first (by min_score desc) and logs a warning.
        """
        result = await self._session.execute(
            select(RewardPolicy)
            .where(
                RewardPolicy.min_score <= score,
                RewardPolicy.max_score >= score,
            )
            .order_by(RewardPolicy.min_score.desc())
        )
        rows = list(result.scalars().all())
        if len(rows) > 1:
            logger.warning(
                "find_band_for_score: score=%s matched %d overlapping policies (ids=%s); returning first",
                score,
                len(rows),
                [r.id for r in rows],
            )
        return rows[0] if rows else None

    async def add(self, policy: RewardPolicy) -> RewardPolicy:
        """Persist a reward policy."""
        return await persist_and_refresh(self._session, policy)
