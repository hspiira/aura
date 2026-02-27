"""User ORM model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.department import Department
    from app.infrastructure.persistence.models.role import Role


class User(CuidMixin, TimestampMixin, Base):
    """User table. Role, department, optional supervisor."""

    __tablename__ = "users"

    role_id: Mapped[str] = mapped_column(
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    supervisor_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
        foreign_keys=[role_id],
    )
    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="users",
        foreign_keys=[department_id],
    )
    supervisor: Mapped["User | None"] = relationship(
        "User",
        remote_side="User.id",
        back_populates="direct_reports",
        foreign_keys=[supervisor_id],
    )
    direct_reports: Mapped[list["User"]] = relationship(
        "User",
        back_populates="supervisor",
        foreign_keys=[supervisor_id],
    )
