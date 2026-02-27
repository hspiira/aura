"""Objective repository."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.persist import persist_and_refresh


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

    async def sum_weight_for_user_cycle_excluding(
        self,
        user_id: str,
        performance_cycle_id: str,
        exclude_objective_id: str,
    ) -> Decimal:
        """Sum weight for user/cycle excluding one objective (DB aggregate)."""
        result = await self._session.execute(
            select(func.coalesce(func.sum(Objective.weight), 0)).where(
                Objective.user_id == user_id,
                Objective.performance_cycle_id == performance_cycle_id,
                Objective.id != exclude_objective_id,
            )
        )
        value = result.scalar_one()
        return Decimal("0") if value is None else Decimal(str(value))

    async def get_by_id(self, id: str) -> Objective | None:
        """Return one objective by id."""
        result = await self._session.execute(
            select(Objective).where(Objective.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, objective: Objective) -> Objective:
        """Persist an objective."""
        return await persist_and_refresh(self._session, objective)

    async def update_status(self, objective: Objective, new_status: str) -> Objective:
        """Update objective status and refresh."""
        objective.status = new_status
        await self._session.flush()
        await self._session.refresh(objective)
        return objective

    async def set_locked_at(
        self, objective: Objective, locked_at: datetime | None
    ) -> Objective:
        """Set objective locked_at timestamp (None to unlock)."""
        objective.locked_at = locked_at
        await self._session.flush()
        await self._session.refresh(objective)
        return objective
