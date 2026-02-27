"""Baseline snapshot repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)


class BaselineSnapshotRepository:
    """Repository for BaselineSnapshot (append-only, immutable)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> list[BaselineSnapshot]:
        """Return baselines for a user and performance cycle."""
        result = await self._session.execute(
            select(BaselineSnapshot)
            .where(
                BaselineSnapshot.user_id == user_id,
                BaselineSnapshot.performance_cycle_id == performance_cycle_id,
            )
            .order_by(
                BaselineSnapshot.snapshot_date.desc(),
                BaselineSnapshot.id.desc(),
            )
        )
        return list(result.scalars().all())

    async def get_by_user_cycle_template(
        self,
        user_id: str,
        performance_cycle_id: str,
        template_id: str,
    ) -> BaselineSnapshot | None:
        """Return one baseline for user/cycle/template if any."""
        result = await self._session.execute(
            select(BaselineSnapshot)
            .where(
                BaselineSnapshot.user_id == user_id,
                BaselineSnapshot.performance_cycle_id == performance_cycle_id,
                BaselineSnapshot.template_id == template_id,
            )
            .order_by(
                BaselineSnapshot.snapshot_date.desc(),
                BaselineSnapshot.id.desc(),
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, id: str) -> BaselineSnapshot | None:
        """Return one baseline by id."""
        result = await self._session.execute(
            select(BaselineSnapshot).where(BaselineSnapshot.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, snapshot: BaselineSnapshot) -> BaselineSnapshot:
        """Persist a baseline snapshot."""
        self._session.add(snapshot)
        await self._session.flush()
        await self._session.refresh(snapshot)
        return snapshot
