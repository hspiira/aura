"""Dimension table: cycle snapshot for analytics."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base
from app.shared.utils import generate_cuid


class DimCycle(Base):
    """Analytics dimension: performance cycle (ETL snapshot)."""

    __tablename__ = "dim_cycle"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=generate_cuid,
    )
    cycle_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    etl_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
