"""ObjectiveScore ORM model (achievement %, weighted score, locked)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective


class ObjectiveScore(CuidMixin, TimestampMixin, Base):
    """Calculated score for an objective (immutable when locked)."""

    __tablename__ = "objective_scores"

    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    achievement_percentage: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False
    )
    weighted_score: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    locked: Mapped[bool] = mapped_column(default=False, nullable=False)

    objective: Mapped["Objective"] = relationship(
        "Objective",
        back_populates="score",
        foreign_keys=[objective_id],
    )
