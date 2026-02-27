"""Notification rule repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.notification_rule import (
    NotificationRule,
)
from app.infrastructure.persistence.persist import persist_and_refresh


class NotificationRuleRepository:
    """Repository for NotificationRule entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[NotificationRule]:
        """Return all notification rules."""
        result = await self._session.execute(
            select(NotificationRule).order_by(
                NotificationRule.event_type,
                NotificationRule.recipient_role_id,
            )
        )
        return list(result.scalars().all())

    async def list_by_event_type(
        self, event_type: str
    ) -> list[NotificationRule]:
        """Return rules for an event type."""
        result = await self._session.execute(
            select(NotificationRule)
            .where(NotificationRule.event_type == event_type)
            .order_by(NotificationRule.recipient_role_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> NotificationRule | None:
        """Return one rule by id."""
        result = await self._session.execute(
            select(NotificationRule).where(NotificationRule.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, rule: NotificationRule) -> NotificationRule:
        """Persist a notification rule."""
        return await persist_and_refresh(self._session, rule)
