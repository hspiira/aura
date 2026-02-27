"""ObjectiveFlag ORM model (stale_update, etc.)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin


class ObjectiveFlag(CuidMixin, Base):
    """Flag set on an objective (e.g. stale_update after 90 days without update)."""

    __tablename__ = "objective_flags"

    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
    )
    flag_type: Mapped[str] = mapped_column(String(32), nullable=False)
    set_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
