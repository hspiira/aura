"""Dimension table: time hierarchy for analytics."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base


class DimTime(Base):
    """Analytics dimension: year/quarter for reporting."""

    __tablename__ = "dim_time"

    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    quarter: Mapped[int] = mapped_column(Integer, primary_key=True)
    label: Mapped[str | None] = mapped_column(String(32), nullable=True)
