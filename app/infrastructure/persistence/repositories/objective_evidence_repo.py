"""Objective evidence repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective_evidence import (
    ObjectiveEvidence,
)


class ObjectiveEvidenceRepository:
    """Repository for ObjectiveEvidence entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_objective(self, objective_id: str) -> list[ObjectiveEvidence]:
        """Return evidence for an objective."""
        result = await self._session.execute(
            select(ObjectiveEvidence)
            .where(ObjectiveEvidence.objective_id == objective_id)
            .order_by(ObjectiveEvidence.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> ObjectiveEvidence | None:
        """Return one evidence by id."""
        result = await self._session.execute(
            select(ObjectiveEvidence).where(ObjectiveEvidence.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, evidence: ObjectiveEvidence) -> ObjectiveEvidence:
        """Persist objective evidence."""
        self._session.add(evidence)
        await self._session.flush()
        await self._session.refresh(evidence)
        return evidence
