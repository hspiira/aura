"""Objective update repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective_update import ObjectiveUpdate


class ObjectiveUpdateRepository:
    """Repository for ObjectiveUpdate entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_objective(self, objective_id: str) -> list[ObjectiveUpdate]:
        """Return updates for an objective."""
        result = await self._session.execute(
            select(ObjectiveUpdate)
            .where(ObjectiveUpdate.objective_id == objective_id)
            .order_by(ObjectiveUpdate.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> ObjectiveUpdate | None:
        """Return one update by id."""
        result = await self._session.execute(
            select(ObjectiveUpdate).where(ObjectiveUpdate.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, update: ObjectiveUpdate) -> ObjectiveUpdate:
        """Persist an objective update."""
        self._session.add(update)
        await self._session.flush()
        await self._session.refresh(update)
        return update
