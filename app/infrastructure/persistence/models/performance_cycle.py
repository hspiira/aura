"""PerformanceCycle ORM model."""

from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class PerformanceCycle(CuidMixin, TimestampMixin, Base):
    """Performance cycle (e.g. annual)."""

    __tablename__ = "performance_cycles"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    review_frequency: Mapped[str | None] = mapped_column(String(64), nullable=True)
