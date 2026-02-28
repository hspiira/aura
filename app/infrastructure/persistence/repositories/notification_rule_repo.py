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

    async def list_by_event_type(self, event_type: str) -> list[NotificationRule]:
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

    async def update(
        self,
        id: str,
        *,
        event_type: str | None = None,
        recipient_role_id: str | None = None,
        channel: str | None = None,
        template_body: str | None = None,
    ) -> NotificationRule | None:
        """Update a notification rule by id. Returns updated rule or None."""
        rule = await self.get_by_id(id)
        if rule is None:
            return None
        if event_type is not None:
            rule.event_type = event_type
        if recipient_role_id is not None:
            rule.recipient_role_id = recipient_role_id
        if channel is not None:
            rule.channel = channel
        if template_body is not None:
            rule.template_body = template_body
        return await persist_and_refresh(self._session, rule)

    async def delete(self, id: str) -> bool:
        """Delete a notification rule by id. Returns True if deleted."""
        rule = await self.get_by_id(id)
        if rule is None:
            return False
        await self._session.delete(rule)
        await self._session.flush()
        return True
