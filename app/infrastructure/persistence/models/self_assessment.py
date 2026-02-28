"""SelfAssessment ORM model (employee self-evaluation before manager review)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
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
    from app.infrastructure.persistence.models.user import User


class SelfAssessment(CuidMixin, TimestampMixin, Base):
    """Employee self-evaluation for an appraisal period.

    User-facing name: "Self-Evaluation"
    Purpose: Employee rates themselves and documents development areas BEFORE
    the manager conducts the formal appraisal. Creates the dual-column view
    in the PAF (matching Mgt.xlsx format: employee score | manager score).

    One self-assessment per user per cycle.
    Status: draft → submitted
    """

    __tablename__ = "self_assessments"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_self_assessments_user_cycle",
        ),
        CheckConstraint(
            "status IN ('draft', 'submitted')",
            name="ck_self_assessments_status",
        ),
        CheckConstraint(
            "self_rating_value IS NULL OR (self_rating_value >= 1 AND self_rating_value <= 5)",
            name="ck_self_assessments_rating_range",
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

    # --- Overall self-rating ---
    # Employee's own % score estimate (0–100)
    self_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    # Employee's 1–5 rating (maps to "Outstanding", "Meets", etc.)
    self_rating_value: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # --- PAF qualitative sections (from Mgt.xlsx) ---
    # What the employee thinks went well
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    # What the employee identifies as improvement areas
    development_areas: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Where the employee wants to grow / career direction
    career_aspirations: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Resources or support the employee needs from the organisation
    support_needed: Mapped[str | None] = mapped_column(Text, nullable=True)
    # General narrative comment on overall performance
    overall_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Workflow ---
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Manager response (filled during/after appraisal meeting) ---
    # Whether the manager broadly concurs with the self-evaluation
    manager_agrees: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    # Manager's written response to the self-evaluation
    manager_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    manager_responded_at: Mapped[datetime | None] = mapped_column(
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
