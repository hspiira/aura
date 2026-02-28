"""ObjectiveGroup ORM model (Objective Area — groups KPIs within a Pillar)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )


class ObjectiveGroup(CuidMixin, TimestampMixin, Base):
    """Objective Area — the middle tier of the 3-level hierarchy.

    Hierarchy: Pillar (PerformanceDimension) → Objective Area (ObjectiveGroup) → KPI (Objective)

    User-facing name: "Objective Area" or "Focus Area"
    Examples: "Client Satisfaction", "Cost Management", "IT Infrastructure"

    Weights within a Pillar should sum to 100% across all active groups
    in that dimension (enforced at the application layer).
    """

    __tablename__ = "objective_groups"

    dimension_id: Mapped[str] = mapped_column(
        ForeignKey("performance_dimensions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    # Weight of this group within its Pillar (should sum to 100% per dimension)
    default_weight_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )
    # Display ordering within the Pillar
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    dimension: Mapped["PerformanceDimension"] = relationship(
        "PerformanceDimension",
        foreign_keys=[dimension_id],
        back_populates="groups",
    )
    objectives: Mapped[list["Objective"]] = relationship(
        "Objective",
        back_populates="group",
        foreign_keys="Objective.group_id",
    )
