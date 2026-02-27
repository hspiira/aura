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
    from app.infrastructure.persistence.models.objective_evidence import (
        ObjectiveEvidence,
    )
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
    """Objective: user, cycle, dimension, title, target, weight, status, approval."""

    __tablename__ = "objectives"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','submitted','rejected','approved','active',"
            "'at_risk','completed','under_review','closed')",
            name="ck_objectives_status",
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
