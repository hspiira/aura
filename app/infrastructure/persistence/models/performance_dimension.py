"""PerformanceDimension ORM model (e.g. Financial, Operational, Behavioral)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.role_dimension_weight import (
        RoleDimensionWeight,
    )


class PerformanceDimension(CuidMixin, TimestampMixin, Base):
    """Performance dimension with default weight."""

    __tablename__ = "performance_dimensions"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_quantitative: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    default_weight_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0"),
        nullable=False,
    )

    role_weights: Mapped[list[RoleDimensionWeight]] = relationship(
        "RoleDimensionWeight",
        back_populates="dimension",
        foreign_keys="RoleDimensionWeight.dimension_id",
    )
