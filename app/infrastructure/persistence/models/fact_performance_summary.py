"""Fact table: performance summary snapshot for analytics (ETL target)."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base
from app.shared.utils import generate_cuid


class FactPerformanceSummary(Base):
    """Analytics fact: one row per user per cycle (ETL from performance_summaries)."""

    __tablename__ = "fact_performance_summary"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_fact_performance_summary_user_cycle",
        ),
    )

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=generate_cuid,
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=False)
    department_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    role_id: Mapped[str] = mapped_column(String(128), nullable=False, index=False)
    performance_cycle_id: Mapped[str] = mapped_column(
        String(128), nullable=False, index=False
    )
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    quantitative_score: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    behavioral_score: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    final_score: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    rating_band: Mapped[str | None] = mapped_column(String(64), nullable=True)
    etl_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
