"""DevelopmentGoal ORM model (individual development plan arising from appraisal)."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class DevelopmentGoal(CuidMixin, TimestampMixin, Base):
    """Individual development goal for a user within an appraisal period.

    User-facing name: "Development Area" / "Growth Plan"
    Purpose: Documents the growth actions agreed between employee and manager
    during the appraisal. Matches the "Areas of Development", "Potential Assessment",
    and career sections in the CEO's PAF (Mgt.xlsx).

    Multiple development goals per user per cycle are supported.
    Status: planned → in_progress → completed | deferred
    """

    __tablename__ = "development_goals"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'in_progress', 'completed', 'deferred')",
            name="ck_development_goals_status",
        ),
        CheckConstraint(
            "potential_rating IS NULL OR potential_rating IN "
            "('high', 'medium', 'low', 'promotable', 'ready_now', 'ready_1yr', 'ready_2yr_plus')",
            name="ck_development_goals_potential",
        ),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    performance_cycle_id: Mapped[str] = mapped_column(
        ForeignKey("performance_cycles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- The development area ---
    # Broad category: "Leadership", "Technical Skills", "Client Relationships", "Communication"
    area: Mapped[str] = mapped_column(String(255), nullable=False)
    # Specific, actionable goal: "Complete ACII exams by June 2025"
    goal: Mapped[str] = mapped_column(String(1000), nullable=False)
    # How they will achieve it: "Study 5hrs/week, employer sponsors exam fee"
    action_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    # What the organisation needs to provide: "Training budget", "Study leave"
    support_required: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    target_completion: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- Progress & outcome ---
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="planned")
    # What actually happened (filled at cycle end or when completed)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Potential assessment (from Mgt.xlsx "Potential Assessment" section) ---
    # Manager's assessment of the employee's growth potential
    # Values: "high" | "medium" | "low" (or detailed: "promotable", "ready_now", etc.)
    potential_rating: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Plain text timeline note: "Ready for promotion in 2 years with targeted development"
    readiness_timeline: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- Who documented this ---
    # Typically the manager; could be HR
    manager_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_at: Mapped[datetime | None] = mapped_column(
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
    manager: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[manager_id],
    )
