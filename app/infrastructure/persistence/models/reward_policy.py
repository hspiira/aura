"""RewardPolicy ORM model (rating band: score range → label, numeric rating, colour)."""

from decimal import Decimal

from sqlalchemy import CheckConstraint, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class RewardPolicy(CuidMixin, TimestampMixin, Base):
    """Rating band: score range maps to a label, numeric 1–5 rating, and colour.

    User-facing name: "Rating Band" / "Performance Band"

    Standard Minet Uganda configuration (from Mgt.xlsx):
      rating_value=5, label="Outstanding",           min=121, max=150, color="#1b5e20"
      rating_value=4, label="Exceeds Expectations",  min=106, max=120, color="#388e3c"
      rating_value=3, label="Meets Expectations",    min=91,  max=105, color="#f57f17"
      rating_value=2, label="Below Expectations",    min=76,  max=90,  color="#e65100"
      rating_value=1, label="Unsatisfactory",        min=0,   max=75,  color="#b71c1c"
    """

    __tablename__ = "reward_policies"
    __table_args__ = (
        CheckConstraint(
            "min_score <= max_score",
            name="ck_reward_policies_min_score_lte_max_score",
        ),
        CheckConstraint(
            "rating_value >= 1 AND rating_value <= 5",
            name="ck_reward_policies_rating_value_range",
        ),
    )

    min_score: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    max_score: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Legacy fields (kept for backward compatibility)
    reward_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reward_value: Mapped[str] = mapped_column(String(255), nullable=False)

    # Human-readable rating label shown to users
    # User-facing label: "Performance Rating"
    rating_label: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Numeric 1–5 rating (matching Mgt.xlsx PAF scale)
    # 1=Unsatisfactory, 2=Below, 3=Meets, 4=Exceeds, 5=Outstanding
    rating_value: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Hex colour code for UI badges and progress indicators
    # e.g. "#1b5e20" (dark green), "#b71c1c" (dark red)
    color_hex: Mapped[str | None] = mapped_column(String(16), nullable=True)
