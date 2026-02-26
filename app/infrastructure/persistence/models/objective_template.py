"""ObjectiveTemplate ORM model (governance, immutable after cycle start)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )


class ObjectiveTemplate(CuidMixin, TimestampMixin, Base):
    """Template for objectives. Versioned; immutable after cycle start."""

    __tablename__ = "objective_templates"

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    dimension_id: Mapped[str] = mapped_column(
        ForeignKey("performance_dimensions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    kpi_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    default_weight: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0"), nullable=False
    )
    min_target: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    max_target: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    requires_baseline_snapshot: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    dimension: Mapped[PerformanceDimension] = relationship(
        "PerformanceDimension",
        foreign_keys=[dimension_id],
    )
    objectives: Mapped[list[Objective]] = relationship(
        "Objective",
        back_populates="template",
        foreign_keys="Objective.template_id",
    )
