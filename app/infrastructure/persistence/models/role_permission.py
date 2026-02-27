"""RolePermission ORM model (RBAC: role-permission association)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.permission import Permission
    from app.infrastructure.persistence.models.role import Role


class RolePermission(CuidMixin, TimestampMixin, Base):
    """Association: role has a permission."""

    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    role_id: Mapped[str] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission_id: Mapped[str] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="role_permissions",
        foreign_keys=[role_id],
    )
    permission: Mapped["Permission"] = relationship(
        "Permission",
        back_populates="role_permissions",
        foreign_keys=[permission_id],
    )
