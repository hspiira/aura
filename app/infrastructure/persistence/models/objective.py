"""Objective ORM model (user, cycle, dimension, target, weight, status)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective_activity import (
        ObjectiveActivity,
    )
    from app.infrastructure.persistence.models.objective_evidence import (
        ObjectiveEvidence,
    )
    from app.infrastructure.persistence.models.objective_group import ObjectiveGroup
    from app.infrastructure.persistence.models.objective_score import ObjectiveScore
    from app.infrastructure.persistence.models.objective_template import (
        ObjectiveTemplate,
    )
    from app.infrastructure.persistence.models.objective_update import (
        ObjectiveUpdate,
    )
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )
    from app.infrastructure.persistence.models.user import User


class Objective(CuidMixin, TimestampMixin, Base):
    """Objective: user, cycle, dimension, title, target, weight, status, approval.

    Hierarchy: Pillar → Objective Area (group) → KPI (this model)

    cascade_level marks where in the org hierarchy this objective sits:
      company    → CEO strategic objectives
      division   → COO / CFO divisional objectives
      department → Manager department objectives
      individual → Staff personal objectives (default)

    cascade_parent_id optionally links this objective to a higher-level
    objective it contributes toward (visibility + context, not math).

    completion_type determines how achievement % is calculated:
      numeric    → (actual / target) × 100, capped [0, 150]  (default)
      binary     → 0% if actual < 1, else 100%  (done/not done)
      percentage → actual value IS the %, capped [0, 150]
      milestone  → actual must be one of: 0, 25, 50, 75, 100
    """

    __tablename__ = "objectives"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','submitted','rejected','approved','active',"
            "'at_risk','completed','under_review','closed')",
            name="ck_objectives_status",
        ),
        CheckConstraint(
            "cascade_level IN ('company', 'division', 'department', 'individual')",
            name="ck_objectives_cascade_level",
        ),
        CheckConstraint(
            "completion_type IN ('numeric', 'binary', 'percentage', 'milestone')",
            name="ck_objectives_completion_type",
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
    dimension_id: Mapped[str] = mapped_column(
        ForeignKey("performance_dimensions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    template_id: Mapped[str | None] = mapped_column(
        ForeignKey("objective_templates.id", ondelete="SET NULL"),
        nullable=True,
    )

    # --- Objective Area grouping (3-tier hierarchy) ---
    # User-facing label: "Objective Area" / "Focus Area"
    group_id: Mapped[str | None] = mapped_column(
        ForeignKey("objective_groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # --- Cascade (top-down goal alignment) ---
    # Which org hierarchy level this objective belongs to
    cascade_level: Mapped[str] = mapped_column(
        String(32), nullable=False, default="individual"
    )
    # Optional link to a higher-level objective this one contributes toward
    # User-facing label: "Contributes To"
    cascade_parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("objectives.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # --- How progress is measured ---
    # User-facing label: "Target Type"
    completion_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="numeric"
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    kpi_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    unit_of_measure: Mapped[str | None] = mapped_column(String(64), nullable=True)
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    row_version: Mapped[int] = mapped_column(default=0, nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
    dimension: Mapped["PerformanceDimension"] = relationship(
        "PerformanceDimension",
        foreign_keys=[dimension_id],
    )
    template: Mapped["ObjectiveTemplate | None"] = relationship(
        "ObjectiveTemplate",
        back_populates="objectives",
        foreign_keys=[template_id],
    )
    group: Mapped["ObjectiveGroup | None"] = relationship(
        "ObjectiveGroup",
        back_populates="objectives",
        foreign_keys=[group_id],
    )
    # Cascade: objectives this one directly contributes to (parent)
    cascade_parent: Mapped["Objective | None"] = relationship(
        "Objective",
        remote_side="Objective.id",
        foreign_keys=[cascade_parent_id],
        back_populates="cascade_children",
    )
    # Cascade: lower-level objectives that link to this one (children)
    cascade_children: Mapped[list["Objective"]] = relationship(
        "Objective",
        foreign_keys=[cascade_parent_id],
        back_populates="cascade_parent",
    )
    updates: Mapped[list["ObjectiveUpdate"]] = relationship(
        "ObjectiveUpdate",
        back_populates="objective",
        foreign_keys="ObjectiveUpdate.objective_id",
    )
    evidence: Mapped[list["ObjectiveEvidence"]] = relationship(
        "ObjectiveEvidence",
        back_populates="objective",
        foreign_keys="ObjectiveEvidence.objective_id",
    )
    score: Mapped["ObjectiveScore | None"] = relationship(
        "ObjectiveScore",
        back_populates="objective",
        uselist=False,
        foreign_keys="ObjectiveScore.objective_id",
    )

    activities: Mapped[list["ObjectiveActivity"]] = relationship(
        "ObjectiveActivity",
        back_populates="objective",
        foreign_keys="ObjectiveActivity.objective_id",
        order_by="ObjectiveActivity.sort_order",
    )
