"""Dimension table: time hierarchy for analytics."""

from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base


class DimTime(Base):
    """Analytics dimension: year/quarter for reporting."""

    __tablename__ = "dim_time"
    __table_args__ = (
        CheckConstraint(
            "quarter >= 1 AND quarter <= 4",
            name="ck_dim_time_quarter_1_4",
        ),
    )

    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    quarter: Mapped[int] = mapped_column(Integer, primary_key=True)
    label: Mapped[str | None] = mapped_column(String(32), nullable=True)
