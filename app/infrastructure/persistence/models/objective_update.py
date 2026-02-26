"""ObjectiveUpdate ORM model (progress updates, actual value, comment)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective
    from app.infrastructure.persistence.models.user import User


class ObjectiveUpdate(CuidMixin, TimestampMixin, Base):
    """Progress update for an objective (actual value, comment)."""

    __tablename__ = "objective_updates"

    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
    )
    actual_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    submitted_by: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    objective: Mapped["Objective"] = relationship(
        "Objective",
        back_populates="updates",
        foreign_keys=[objective_id],
    )
    submitter: Mapped["User"] = relationship(
        "User",
        foreign_keys=[submitted_by],
    )
