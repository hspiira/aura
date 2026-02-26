"""Objective repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective import Objective


class ObjectiveRepository:
    """Repository for Objective entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Objective]:
        """Return all objectives."""
        result = await self._session.execute(
            select(Objective).order_by(Objective.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_user(self, user_id: str) -> list[Objective]:
        """Return objectives for a user."""
        result = await self._session.execute(
            select(Objective)
            .where(Objective.user_id == user_id)
            .order_by(Objective.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_cycle(self, performance_cycle_id: str) -> list[Objective]:
        """Return objectives for a performance cycle."""
        result = await self._session.execute(
            select(Objective)
            .where(Objective.performance_cycle_id == performance_cycle_id)
            .order_by(Objective.user_id, Objective.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> Objective | None:
        """Return one objective by id."""
        result = await self._session.execute(
            select(Objective).where(Objective.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, objective: Objective) -> Objective:
        """Persist an objective."""
        self._session.add(objective)
        await self._session.flush()
        await self._session.refresh(objective)
        return objective

    async def update_status(self, objective: Objective, new_status: str) -> Objective:
        """Update objective status and refresh."""
        objective.status = new_status
        await self._session.flush()
        await self._session.refresh(objective)
        return objective
