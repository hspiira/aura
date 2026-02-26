"""Organization ORM model (legal entity, policy scope)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.department import Department


class Organization(CuidMixin, TimestampMixin, Base):
    """Organization table."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    departments: Mapped[list[Department]] = relationship(
        "Department",
        back_populates="organization",
        foreign_keys="Department.organization_id",
    )
