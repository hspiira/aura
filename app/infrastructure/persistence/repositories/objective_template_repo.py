"""Objective template repository."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.models.performance_cycle import (
    PerformanceCycle,
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

    async def has_any_objective_in_started_cycle(
        self, template_id: str, on_date: date | None = None
    ) -> bool:
        """True if any objective using this template is in a cycle already started."""
        today = on_date or date.today()
        result = await self._session.execute(
            select(1)
            .select_from(Objective)
            .join(
                PerformanceCycle,
                Objective.performance_cycle_id == PerformanceCycle.id,
            )
            .where(
                Objective.template_id == template_id,
                PerformanceCycle.start_date <= today,
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def update(
        self, template: ObjectiveTemplate, **kwargs: object
    ) -> ObjectiveTemplate:
        """Update template fields (caller must ensure immutability)."""
        for key, value in kwargs.items():
            if hasattr(template, key):
                setattr(template, key, value)
        await self._session.flush()
        await self._session.refresh(template)
        return template

    async def create_new_version(
        self,
        base_template: ObjectiveTemplate,
        updated_fields: dict[str, object],
    ) -> ObjectiveTemplate:
        """Create a new version of a template, deactivating the old one.

        The new template keeps the same code and increments the version.
        """
        merged: dict[str, object] = {
            "code": base_template.code,
            "title": base_template.title,
            "description": base_template.description,
            "dimension_id": base_template.dimension_id,
            "kpi_type": base_template.kpi_type,
            "default_weight": base_template.default_weight,
            "min_target": base_template.min_target,
            "max_target": base_template.max_target,
            "requires_baseline_snapshot": base_template.requires_baseline_snapshot,
            "is_active": True,
            "version": base_template.version + 1,
        }
        merged.update(updated_fields)

        new_template = ObjectiveTemplate(**merged)  # type: ignore[arg-type]
        self._session.add(new_template)
        await self._session.flush()
        await self._session.refresh(new_template)

        base_template.is_active = False
        base_template.superseded_by_id = new_template.id
        await self._session.flush()

        return new_template
