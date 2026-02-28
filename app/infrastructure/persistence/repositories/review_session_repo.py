"""Review session repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.review_session import ReviewSessionStatus
from app.infrastructure.persistence.models.review_session import ReviewSession
from app.infrastructure.persistence.persist import persist_and_refresh
from app.shared.utils.datetime import utc_now


class ReviewSessionRepository:
    """Repository for ReviewSession entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[ReviewSession]:
        """Return all review sessions."""
        result = await self._session.execute(
            select(ReviewSession).order_by(
                ReviewSession.performance_cycle_id,
                ReviewSession.user_id,
                ReviewSession.created_at.desc(),
            )
        )
        return list(result.scalars().all())

    async def list_by_user(self, user_id: str) -> list[ReviewSession]:
        """Return sessions for a user."""
        result = await self._session.execute(
            select(ReviewSession)
            .where(ReviewSession.user_id == user_id)
            .order_by(
                ReviewSession.performance_cycle_id,
                ReviewSession.scheduled_at.desc().nullslast(),
            )
        )
        return list(result.scalars().all())

    async def list_by_cycle(self, performance_cycle_id: str) -> list[ReviewSession]:
        """Return sessions for a performance cycle."""
        result = await self._session.execute(
            select(ReviewSession)
            .where(ReviewSession.performance_cycle_id == performance_cycle_id)
            .order_by(
                ReviewSession.user_id,
                ReviewSession.scheduled_at.desc().nullslast(),
            )
        )
        return list(result.scalars().all())

    async def list_by_user_cycle(
        self, user_id: str, performance_cycle_id: str
    ) -> list[ReviewSession]:
        """Return sessions for a user and cycle."""
        result = await self._session.execute(
            select(ReviewSession)
            .where(
                ReviewSession.user_id == user_id,
                ReviewSession.performance_cycle_id == performance_cycle_id,
            )
            .order_by(ReviewSession.scheduled_at.desc().nullslast())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> ReviewSession | None:
        """Return one session by id."""
        result = await self._session.execute(
            select(ReviewSession).where(ReviewSession.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, session: ReviewSession) -> ReviewSession:
        """Persist a review session."""
        return await persist_and_refresh(self._session, session)

    async def update_status(
        self, session: ReviewSession, new_status: ReviewSessionStatus
    ) -> ReviewSession:
        """Update session status; set completed_at when transitioning to completed."""
        session.status = new_status
        if new_status == ReviewSessionStatus.COMPLETED and session.completed_at is None:
            session.completed_at = utc_now()
        await self._session.flush()
        await self._session.refresh(session)
        return session
