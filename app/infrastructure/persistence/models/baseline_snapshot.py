"""BaselineSnapshot ORM model (frozen at cycle start or objective approval)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective_template import (
        ObjectiveTemplate,
    )
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class BaselineSnapshot(CuidMixin, TimestampMixin, Base):
    """Baseline value for a user/cycle/template. Immutable once created."""

    __tablename__ = "baseline_snapshots"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    performance_cycle_id: Mapped[str] = mapped_column(
        ForeignKey("performance_cycles.id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id: Mapped[str] = mapped_column(
        ForeignKey("objective_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    baseline_value: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    data_source: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
    template: Mapped["ObjectiveTemplate"] = relationship(
        "ObjectiveTemplate",
        foreign_keys=[template_id],
    )
