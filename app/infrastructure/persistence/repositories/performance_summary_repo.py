"""Performance summary repository."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.performance_summary import (
    PerformanceSummary,
)
from app.infrastructure.persistence.persist import persist_and_refresh


class PerformanceSummaryRepository:
    """Repository for PerformanceSummary entities (one per user per cycle)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[PerformanceSummary]:
        """Return all performance summaries."""
        result = await self._session.execute(
            select(PerformanceSummary).order_by(
                PerformanceSummary.user_id,
                PerformanceSummary.performance_cycle_id,
            )
        )
        return list(result.scalars().all())

    async def list_filtered(
        self,
        user_id: str | None = None,
        performance_cycle_id: str | None = None,
    ) -> list[PerformanceSummary]:
        """Return summaries with optional filters (DB-level)."""
        query = select(PerformanceSummary)
        if user_id is not None:
            query = query.where(PerformanceSummary.user_id == user_id)
        if performance_cycle_id is not None:
            query = query.where(
                PerformanceSummary.performance_cycle_id == performance_cycle_id
            )
        query = query.order_by(
            PerformanceSummary.user_id,
            PerformanceSummary.performance_cycle_id,
        )
        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def get_by_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> PerformanceSummary | None:
        """Return summary for user and cycle if any."""
        result = await self._session.execute(
            select(PerformanceSummary).where(
                PerformanceSummary.user_id == user_id,
                PerformanceSummary.performance_cycle_id == performance_cycle_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, id: str) -> PerformanceSummary | None:
        """Return one summary by id."""
        result = await self._session.execute(
            select(PerformanceSummary).where(PerformanceSummary.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, summary: PerformanceSummary) -> PerformanceSummary:
        """Persist a performance summary."""
        return await persist_and_refresh(self._session, summary)

    async def update_scores(
        self,
        summary: PerformanceSummary,
        quantitative_score: Decimal | None,
        behavioral_score: Decimal | None,
        final_weighted_score: Decimal | None,
        final_rating_band: str | None = None,
    ) -> PerformanceSummary:
        """Update computed score fields."""
        summary.quantitative_score = quantitative_score
        summary.behavioral_score = behavioral_score
        summary.final_weighted_score = final_weighted_score
        if final_rating_band is not None:
            summary.final_rating_band = final_rating_band
        await self._session.flush()
        await self._session.refresh(summary)
        return summary

    async def update_metadata(
        self,
        summary: PerformanceSummary,
        final_rating_band: str | None = None,
        manager_comment: str | None = None,
        employee_comment: str | None = None,
        hr_approved: bool | None = None,
    ) -> PerformanceSummary:
        """Update rating band, comments, and hr_approved."""
        if final_rating_band is not None:
            summary.final_rating_band = final_rating_band
        if manager_comment is not None:
            summary.manager_comment = manager_comment
        if employee_comment is not None:
            summary.employee_comment = employee_comment
        if hr_approved is not None:
            summary.hr_approved = hr_approved
        await self._session.flush()
        await self._session.refresh(summary)
        return summary
