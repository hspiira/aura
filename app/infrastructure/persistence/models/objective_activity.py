"""ObjectiveActivity ORM model — the 4th tier of the performance hierarchy.

Hierarchy (4 levels):
  Pillar (PerformanceDimension)
    └── Objective Area (ObjectiveGroup)
          └── KPI / Target (Objective)
                └── Activity / Task (ObjectiveActivity)  ← this model

Activities explain HOW a KPI is achieved. They are the granular work items
that management and EXCO want to see to verify employees are executing correctly.

Two types:
  "scored" — has its own target/actual; weighted contribution to parent KPI score
  "task"   — binary done/not done; visible to management but does NOT affect KPI score

Scoring cascade (when KPI has scored activities):
  KPI achievement % = weighted average of all scored-activity achievement %
  where weights are normalised across scored activities to sum to 100%.

  If no scored activities exist → KPI uses its own actual vs. target (existing logic).

User-facing name: "Activity" or "Task" (depending on context).
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective
    from app.infrastructure.persistence.models.user import User


class ObjectiveActivity(CuidMixin, TimestampMixin, Base):
    """Activity or Task that feeds into a KPI (Objective).

    Examples from Objective Templates.csv:
      KPI "70% Client Satisfaction" → activities: "Net Promoter Score" (scored)
      KPI "Client Retention"        → activities: "Post Renewal Meeting" (task),
                                                   "Renewal Meeting" (task),
                                                   "Review Meeting" (task)
      KPI "100% Doc-It Compliance"  → activities: "Doc-It Audit - Qualitative" (scored),
                                                   "Doc-It Audit - Quantitative" (scored)
    """

    __tablename__ = "objective_activities"
    __table_args__ = (
        CheckConstraint(
            "activity_type IN ('scored', 'task')",
            name="ck_objective_activities_type",
        ),
        CheckConstraint(
            "status IN ('not_started', 'in_progress', 'completed', 'blocked')",
            name="ck_objective_activities_status",
        ),
        CheckConstraint(
            "completion_type IN ('numeric', 'binary', 'percentage', 'milestone')",
            name="ck_objective_activities_completion_type",
        ),
        CheckConstraint(
            "weight IS NULL OR (weight >= 0 AND weight <= 100)",
            name="ck_objective_activities_weight_range",
        ),
    )

    # Parent KPI this activity contributes toward
    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Identity ---
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Type ---
    # "scored": has target/actual; weight counted in KPI score
    # "task":   binary done/not done; management visibility only, no score impact
    activity_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="scored"
    )

    # --- Scoring (scored activities only) ---
    # Relative weight of this activity within the KPI
    # All scored activities' weights are normalised to sum to 100% at compute time
    weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    # How achievement is measured
    completion_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="numeric"
    )
    # The goal value (required for scored numeric/percentage types)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    # The latest recorded actual (updated via progress check-ins)
    actual_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    # Unit label shown in UI: "%", "UGX", "meetings", "hours"
    unit_of_measure: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # --- Timeline ---
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- Status ---
    # User-facing: "Not Started" | "In Progress" | "Completed" | "Blocked"
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="not_started"
    )

    # --- Manager oversight (key management/EXCO visibility feature) ---
    # Manager verifies this activity has been done to their satisfaction
    manager_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    manager_verified_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    manager_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Manager's comment on this specific activity (e.g., "NPS submitted but survey sample too small")
    manager_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # --- Display ordering within parent KPI ---
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    objective: Mapped["Objective"] = relationship(
        "Objective",
        foreign_keys=[objective_id],
        back_populates="activities",
    )
    verifying_manager: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[manager_verified_by],
    )
