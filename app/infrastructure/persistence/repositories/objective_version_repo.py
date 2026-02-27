"""ObjectiveVersion repository for amendment history snapshots."""

from datetime import datetime
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.sql.elements import Select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_version import ObjectiveVersion
from app.infrastructure.persistence.persist import persist_and_refresh


class ObjectiveVersionRepository:
    """Repository for ObjectiveVersion entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_objective(self, objective_id: str) -> list[ObjectiveVersion]:
        """Return all versions for an objective ordered by version ascending."""
        stmt: Select[tuple[ObjectiveVersion]] = (
            select(ObjectiveVersion)
            .where(ObjectiveVersion.objective_id == objective_id)
            .order_by(ObjectiveVersion.version.asc())
        )
        result = await self._session.execute(stmt)
        rows: Sequence[ObjectiveVersion] = result.scalars().all()
        return list(rows)

    async def add_from_objective(
        self,
        objective: Objective,
        version: int,
        justification: str | None,
        amended_by: str | None,
        amended_at: datetime,
    ) -> ObjectiveVersion:
        """Snapshot current objective state into objective_versions."""
        snapshot = ObjectiveVersion(
            objective_id=objective.id,
            version=version,
            title=objective.title,
            description=objective.description,
            target_value=objective.target_value,
            weight=objective.weight,
            status=objective.status,
            amended_at=amended_at,
            amended_by=amended_by,
            justification=justification,
        )
        return await persist_and_refresh(self._session, snapshot)
