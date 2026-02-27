"""UserIdentity ORM model — links external IdP identities to local Users."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.user import User


class UserIdentity(CuidMixin, TimestampMixin, Base):
    """External identity mapping for SSO providers.

    Each row represents a single external identity (provider + subject) bound to a User.
    """

    __tablename__ = "user_identities"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
