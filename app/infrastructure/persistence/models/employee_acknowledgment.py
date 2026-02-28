"""EmployeeAcknowledgment ORM model (employee sign-off on final appraisal)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.performance_summary import (
        PerformanceSummary,
    )
    from app.infrastructure.persistence.models.user import User


class EmployeeAcknowledgment(CuidMixin, TimestampMixin, Base):
    """Employee sign-off on their final appraisal summary.

    User-facing name: "Acknowledgment" / "Sign-Off"
    Purpose: Records that the employee has read and acknowledged their final
    performance rating. This is the digital equivalent of the signature block
    at the bottom of Mgt.xlsx (employee + supervisor + HR signatures).

    Legal/compliance requirement: without this, an employee can claim they
    never saw their appraisal outcome.

    One acknowledgment per user per cycle.
    The cycle is considered fully complete for that person only when:
      acknowledged = True AND hr_approved = True (on PerformanceSummary)
    """

    __tablename__ = "employee_acknowledgments"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_employee_acknowledgments_user_cycle",
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
    performance_summary_id: Mapped[str] = mapped_column(
        ForeignKey("performance_summaries.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Acknowledgment status ---
    acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Employee's final statement (optional) ---
    # Free-form comment submitted alongside acknowledgment
    employee_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Does the employee agree with their rating?
    agrees_with_rating: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    # If they disagree, their stated reason (triggers HR escalation workflow)
    dispute_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- HR dispute resolution (if employee disagrees) ---
    dispute_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dispute_resolution_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    dispute_resolved_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    dispute_resolved_at: Mapped[datetime | None] = mapped_column(
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
    performance_summary: Mapped["PerformanceSummary"] = relationship(
        "PerformanceSummary",
        foreign_keys=[performance_summary_id],
    )
    resolved_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[dispute_resolved_by],
    )
