"""RewardPolicy ORM model (min/max score, reward type, reward value)."""

from decimal import Decimal

from sqlalchemy import CheckConstraint, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class RewardPolicy(CuidMixin, TimestampMixin, Base):
    """Reward band: score range maps to reward type and value."""

    __tablename__ = "reward_policies"
    __table_args__ = (
        CheckConstraint(
            "min_score <= max_score",
            name="ck_reward_policies_min_score_lte_max_score",
        ),
    )

    min_score: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    max_score: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    reward_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reward_value: Mapped[str] = mapped_column(String(255), nullable=False)
