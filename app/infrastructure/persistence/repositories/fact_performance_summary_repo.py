"""Fact performance summary repository (analytics, read-only + ETL write)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.persist import persist_and_refresh


class FactPerformanceSummaryRepository:
    """Repository for FactPerformanceSummary (analytics fact)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(
        self,
        cycle_year: int | None = None,
        department_id: str | None = None,
        limit: int = 1000,
    ) -> list[FactPerformanceSummary]:
        """Return fact rows; filter by cycle_year and/or department_id."""
        q = select(FactPerformanceSummary).order_by(
            FactPerformanceSummary.cycle_year.desc(),
            FactPerformanceSummary.etl_at.desc(),
        )
        if cycle_year is not None:
            q = q.where(FactPerformanceSummary.cycle_year == cycle_year)
        if department_id is not None:
            q = q.where(FactPerformanceSummary.department_id == department_id)
        q = q.limit(limit)
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def get_by_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> FactPerformanceSummary | None:
        """Return one fact row by user and cycle."""
        result = await self._session.execute(
            select(FactPerformanceSummary).where(
                FactPerformanceSummary.user_id == user_id,
                FactPerformanceSummary.performance_cycle_id == performance_cycle_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, fact: FactPerformanceSummary) -> FactPerformanceSummary:
        """Insert or update one fact row (by user_id, performance_cycle_id)."""
        existing = await self.get_by_user_cycle(
            user_id=fact.user_id,
            performance_cycle_id=fact.performance_cycle_id,
        )
        if existing is None:
            return await persist_and_refresh(self._session, fact)

        existing.department_id = fact.department_id
        existing.role_id = fact.role_id
        existing.cycle_year = fact.cycle_year
        existing.quantitative_score = fact.quantitative_score
        existing.behavioral_score = fact.behavioral_score
        existing.final_score = fact.final_score
        existing.rating_band = fact.rating_band
        return await self.refresh(existing)

    async def refresh(self, fact: FactPerformanceSummary) -> FactPerformanceSummary:
        """Flush and refresh an existing fact row."""
        await self._session.flush()
        await self._session.refresh(fact)
        return fact
