"""NotificationRule ORM model (event_type, recipient_role, channel, template)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.role import Role


class NotificationRule(CuidMixin, TimestampMixin, Base):
    """Rule: when event_type occurs, notify recipient_role via channel with template."""

    __tablename__ = "notification_rules"
    __table_args__ = (
        UniqueConstraint(
            "event_type",
            "recipient_role_id",
            "channel",
            name="uq_notification_rule_event_role_channel",
        ),
    )

    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    recipient_role_id: Mapped[str] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    template_body: Mapped[str | None] = mapped_column(Text, nullable=True)

    recipient_role: Mapped[Role] = relationship(
        "Role",
        foreign_keys=[recipient_role_id],
    )
