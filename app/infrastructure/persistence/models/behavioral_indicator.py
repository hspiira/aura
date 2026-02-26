"""BehavioralIndicator ORM model (dimension, name, rating scale 1–5)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )


class BehavioralIndicator(CuidMixin, TimestampMixin, Base):
    """Behavioral indicator tied to a dimension (e.g. rating 1–5)."""

    __tablename__ = "behavioral_indicators"

    dimension_id: Mapped[str] = mapped_column(
        ForeignKey("performance_dimensions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    rating_scale_min: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    rating_scale_max: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    dimension: Mapped["PerformanceDimension"] = relationship(
        "PerformanceDimension",
        foreign_keys=[dimension_id],
    )
