"""NotificationOutbox — transactional outbox for reliable event delivery."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class NotificationOutbox(CuidMixin, TimestampMixin, Base):
    """Pending event for delivery. Written in same transaction as the trigger."""

    __tablename__ = "notification_outbox"

    event_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    context: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        default="pending",
        nullable=False,
        index=True,
    )  # pending | processing | delivered | failed
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    process_after: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
