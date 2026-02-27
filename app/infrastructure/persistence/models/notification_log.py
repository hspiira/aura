"""NotificationLog ORM model (append-only log of sent notifications)."""

from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin


class NotificationLog(CuidMixin, Base):
    """Log entry for a notification sent (append-only)."""

    __tablename__ = "notification_logs"
    __table_args__ = (
        Index("ix_notification_logs_sent_at", "sent_at"),
        Index("ix_notification_logs_event_type_sent_at", "event_type", "sent_at"),
    )

    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    recipient_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="sent", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
