"""ObjectiveEvidence ORM model (file reference, description, uploaded by)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.objective import Objective
    from app.infrastructure.persistence.models.user import User


class ObjectiveEvidence(CuidMixin, TimestampMixin, Base):
    """Evidence attachment for an objective (path/URL, description)."""

    __tablename__ = "objective_evidence"

    objective_id: Mapped[str] = mapped_column(
        ForeignKey("objectives.id", ondelete="CASCADE"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    uploaded_by: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    objective: Mapped["Objective"] = relationship(
        "Objective",
        back_populates="evidence",
        foreign_keys=[objective_id],
    )
    uploader: Mapped["User"] = relationship(
        "User",
        foreign_keys=[uploaded_by],
    )
