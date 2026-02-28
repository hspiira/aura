"""Objective repository."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy import update as sa_update
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

    async def list_paginated(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Objective], int]:
        """Return page of objectives and total count."""
        count_result = await self._session.execute(
            select(func.count()).select_from(Objective)
        )
        total = count_result.scalar_one()
        result = await self._session.execute(
            select(Objective)
            .order_by(Objective.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

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

    async def get_by_id_for_update(self, id: str) -> Objective | None:
        """Fetch objective with SELECT FOR UPDATE (pessimistic lock)."""
        result = await self._session.execute(
            select(Objective).where(Objective.id == id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def refresh(self, objective: Objective) -> Objective:
        """Flush and refresh an objective after in-place modifications."""
        await self._session.flush()
        await self._session.refresh(objective)
        return objective

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

    async def set_locked_at_versioned(
        self,
        objective: Objective,
        locked_at: datetime,
        expected_version: int,
    ) -> Objective:
        """Set locked_at only if row_version matches expected; raise 409 on conflict."""
        result = await self._session.execute(
            sa_update(Objective)
            .where(
                Objective.id == objective.id,
                Objective.row_version == expected_version,
            )
            .values(locked_at=locked_at, row_version=expected_version + 1)
            .returning(Objective.id)
        )
        if result.scalar_one_or_none() is None:
            from app.domain.exceptions import ConflictException

            raise ConflictException(
                "Objective was modified by another request. Retry.",
                entity_type="Objective",
                entity_id=objective.id,
            )
        await self._session.refresh(objective)
        return objective

    async def list_unlocked_older_than(
        self,
        cutoff: datetime,
    ) -> list[Objective]:
        """Return unlocked objectives created before the cutoff."""
        result = await self._session.execute(
            select(Objective).where(
                Objective.locked_at.is_(None),
                Objective.created_at < cutoff,
            )
        )
        return list(result.scalars().all())
