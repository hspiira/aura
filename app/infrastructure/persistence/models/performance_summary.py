"""PerformanceSummary ORM model (user, cycle, quant/behavioral/final scores)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class PerformanceSummary(CuidMixin, TimestampMixin, Base):
    """Final performance summary per user per cycle (immutable once approved).

    Score breakdown:
      own_score             = weighted avg of the user's personal objectives only
      team_score            = average of all direct reports' final_weighted_scores
                              (null for staff-level where team_weight_pct = 0)
      team_weight_pct_used  = the role's team_weight_pct at time of computation
                              (snapshotted so future role changes don't alter history)
      final_weighted_score  = (own_score × own_weight) + (team_score × team_weight)
                              where own_weight = 100 - team_weight_pct_used

    User-facing name: "Appraisal Summary" / "PAF Summary"
    """

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

    # --- Score components ---
    # Score from the user's own objectives (existing quantitative logic)
    # User-facing label: "Personal Score"
    quantitative_score: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    behavioral_score: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    # Combined personal score (quant + behavioral, before team contribution)
    # User-facing label: "Personal Score"
    own_score: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Average of direct reports' final_weighted_scores
    # User-facing label: "Team Score"
    # Null for staff (no direct reports / team_weight_pct = 0)
    team_score: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Snapshotted team weight % used at computation time
    # Allows audit: "score was computed with 30% team weight"
    team_weight_pct_used: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    # Final overall score: (own × own_weight%) + (team × team_weight%)
    # User-facing label: "Overall Score"
    final_weighted_score: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    # --- Rating ---
    # Text band: "Outstanding", "Exceeds Expectations", etc.
    # User-facing label: "Performance Rating"
    final_rating_band: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Numeric 1–5 rating (from RewardPolicy.rating_value)
    # User-facing label: "Rating (1–5)"
    rating_value: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # --- Comments ---
    manager_comment: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    employee_comment: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # --- Approval & acknowledgment ---
    # HR final sign-off
    hr_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Employee has read and acknowledged their final appraisal
    # User-facing label: "Employee Acknowledged"
    employee_acknowledged: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    employee_acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
