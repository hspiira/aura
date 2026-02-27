"""Notification log repository (append-only)."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.notification_log import (
    NotificationLog,
)
from app.infrastructure.persistence.persist import persist_and_refresh

MAX_LIMIT = 1000


class NotificationLogRepository:
    """Repository for NotificationLog (append-only)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self, limit: int = 100) -> list[NotificationLog]:
        """Return recent log entries (newest first)."""
        limit = max(1, min(limit, MAX_LIMIT))
        result = await self._session.execute(
            select(NotificationLog)
            .order_by(NotificationLog.sent_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_event_type(
        self,
        event_type: str,
        limit: int = 50,
    ) -> list[NotificationLog]:
        """Return log entries for an event type."""
        limit = max(1, min(limit, MAX_LIMIT))
        result = await self._session.execute(
            select(NotificationLog)
            .where(NotificationLog.event_type == event_type)
            .order_by(NotificationLog.sent_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_paginated(
        self,
        limit: int = 100,
        offset: int = 0,
        event_type: str | None = None,
    ) -> tuple[list[NotificationLog], int]:
        """Return page of notification logs (optionally filtered by event_type)."""
        base_query = select(NotificationLog)
        count_query = select(func.count()).select_from(NotificationLog)
        if event_type is not None:
            base_query = base_query.where(NotificationLog.event_type == event_type)
            count_query = count_query.where(NotificationLog.event_type == event_type)
        count_result = await self._session.execute(count_query)
        total = count_result.scalar_one()
        result = await self._session.execute(
            base_query.order_by(NotificationLog.sent_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def add(self, entry: NotificationLog) -> NotificationLog:
        """Append a notification log entry."""
        return await persist_and_refresh(self._session, entry)
