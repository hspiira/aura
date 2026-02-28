"""NotificationOutbox repository."""

from datetime import timedelta
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.notification_outbox import NotificationOutbox
from app.shared.utils.datetime import utc_now


class NotificationOutboxRepository:
    """Repository for NotificationOutbox entries."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, event_type: str, context: dict[str, Any]) -> NotificationOutbox:
        """Append a pending outbox entry."""
        entry = NotificationOutbox(
            event_type=event_type,
            context=context,
            status="pending",
            attempts=0,
        )
        self._session.add(entry)
        await self._session.flush()
        await self._session.refresh(entry)
        return entry

    async def list_pending(self, limit: int = 50) -> list[NotificationOutbox]:
        """Return pending entries that are due for processing."""
        now = utc_now()
        result = await self._session.execute(
            select(NotificationOutbox)
            .where(
                NotificationOutbox.status.in_(["pending", "failed"]),
                (NotificationOutbox.process_after.is_(None))
                | (NotificationOutbox.process_after <= now),
            )
            .order_by(NotificationOutbox.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_delivered(self, entry: NotificationOutbox) -> None:
        """Mark an entry as delivered."""
        await self._session.execute(
            update(NotificationOutbox)
            .where(NotificationOutbox.id == entry.id)
            .values(
                status="delivered",
                attempts=entry.attempts + 1,
                last_error=None,
                process_after=None,
            )
        )

    async def mark_failed(
        self,
        entry: NotificationOutbox,
        error: str,
        retry_after: timedelta,
    ) -> None:
        """Mark an entry as failed and schedule a retry."""
        next_time = utc_now() + retry_after
        await self._session.execute(
            update(NotificationOutbox)
            .where(NotificationOutbox.id == entry.id)
            .values(
                status="failed",
                attempts=entry.attempts + 1,
                last_error=error,
                process_after=next_time,
            )
        )
