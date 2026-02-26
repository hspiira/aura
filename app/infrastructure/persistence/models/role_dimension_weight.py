"""RoleDimensionWeight ORM model (weight % per role per dimension)."""

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )
    from app.infrastructure.persistence.models.role import Role


class RoleDimensionWeight(CuidMixin, TimestampMixin, Base):
    """Weight percentage for a dimension within a role."""

    __tablename__ = "role_dimension_weights"
    __table_args__ = (
        UniqueConstraint("role_id", "dimension_id", name="uq_role_dimension"),
    )

    role_id: Mapped[str] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    dimension_id: Mapped[str] = mapped_column(
        ForeignKey("performance_dimensions.id", ondelete="CASCADE"),
        nullable=False,
    )
    weight_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="dimension_weights",
        foreign_keys=[role_id],
    )
    dimension: Mapped["PerformanceDimension"] = relationship(
        "PerformanceDimension",
        back_populates="role_weights",
        foreign_keys=[dimension_id],
    )
