"""CalibrationSession ORM model (cycle, department, conducted by, date, notes)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.department import Department
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.user import User


class CalibrationSession(CuidMixin, TimestampMixin, Base):
    """Calibration session for a department in a performance cycle."""

    __tablename__ = "calibration_sessions"

    performance_cycle_id: Mapped[str] = mapped_column(
        ForeignKey("performance_cycles.id", ondelete="CASCADE"),
        nullable=False,
    )
    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    conducted_by_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    conducted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    performance_cycle: Mapped["PerformanceCycle"] = relationship(
        "PerformanceCycle",
        foreign_keys=[performance_cycle_id],
    )
    department: Mapped["Department"] = relationship(
        "Department",
        foreign_keys=[department_id],
    )
    conducted_by: Mapped["User"] = relationship(
        "User",
        foreign_keys=[conducted_by_id],
    )
