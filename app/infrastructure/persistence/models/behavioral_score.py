"""BehavioralScore ORM model (user, cycle, indicator, rating 1–5)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.behavioral_indicator import (
        BehavioralIndicator,
    )
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class BehavioralScore(CuidMixin, TimestampMixin, Base):
    """Behavioral score for a user/cycle/indicator (rating 1–5, manager comment)."""

    __tablename__ = "behavioral_scores"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            "indicator_id",
            name="uq_behavioral_scores_user_cycle_indicator",
        ),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    performance_cycle_id: Mapped[str] = mapped_column(
        ForeignKey("performance_cycles.id", ondelete="CASCADE"),
        nullable=False,
    )
    indicator_id: Mapped[str] = mapped_column(
        ForeignKey("behavioral_indicators.id", ondelete="RESTRICT"),
        nullable=False,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    manager_comment: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
    indicator: Mapped["BehavioralIndicator"] = relationship(
        "BehavioralIndicator",
        foreign_keys=[indicator_id],
    )
