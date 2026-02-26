"""Objective template repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)


class ObjectiveTemplateRepository:
    """Repository for ObjectiveTemplate entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[ObjectiveTemplate]:
        """Return all templates."""
        result = await self._session.execute(
            select(ObjectiveTemplate).order_by(ObjectiveTemplate.code)
        )
        return list(result.scalars().all())

    async def list_active(self) -> list[ObjectiveTemplate]:
        """Return active templates only."""
        result = await self._session.execute(
            select(ObjectiveTemplate)
            .where(ObjectiveTemplate.is_active.is_(True))
            .order_by(ObjectiveTemplate.code)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> ObjectiveTemplate | None:
        """Return one template by id."""
        result = await self._session.execute(
            select(ObjectiveTemplate).where(ObjectiveTemplate.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> ObjectiveTemplate | None:
        """Return one template by code."""
        result = await self._session.execute(
            select(ObjectiveTemplate).where(ObjectiveTemplate.code == code)
        )
        return result.scalar_one_or_none()

    async def add(self, template: ObjectiveTemplate) -> ObjectiveTemplate:
        """Persist a template."""
        self._session.add(template)
        await self._session.flush()
        await self._session.refresh(template)
        return template
