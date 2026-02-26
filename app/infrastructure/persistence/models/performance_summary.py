"""PerformanceSummary ORM model (user, cycle, quant/behavioral/final scores)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class PerformanceSummary(CuidMixin, TimestampMixin, Base):
    """Final performance summary per user per cycle (immutable once approved)."""

    __tablename__ = "performance_summaries"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_performance_summaries_user_cycle",
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
    quantitative_score: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    behavioral_score: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    final_weighted_score: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    final_rating_band: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    manager_comment: Mapped[str | None] = mapped_column(
        String(2000), nullable=True
    )
    employee_comment: Mapped[str | None] = mapped_column(
        String(2000), nullable=True
    )
    hr_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
