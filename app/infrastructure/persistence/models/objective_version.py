"""ObjectiveVersion ORM model: snapshot history for amended objectives."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective


class ObjectiveVersion(CuidMixin, TimestampMixin, Base):
    """Version history snapshot for an objective amendment."""

    __tablename__ = "objective_versions"

    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    target_value: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 4),
        nullable=True,
    )
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    amended_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    amended_by: Mapped[str | None] = mapped_column(String, nullable=True)
    justification: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    objective: Mapped["Objective"] = relationship(
        "Objective",
        foreign_keys=[objective_id],
    )
