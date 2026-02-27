"""Role ORM model."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.department import Department
    from app.infrastructure.persistence.models.role_dimension_weight import (
        RoleDimensionWeight,
    )
    from app.infrastructure.persistence.models.role_permission import RolePermission
    from app.infrastructure.persistence.models.user import User


class Role(CuidMixin, TimestampMixin, Base):
    """Role table. Tied to department; has default dimension weights."""

    __tablename__ = "roles"

    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_managerial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="roles",
        foreign_keys=[department_id],
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="role",
        foreign_keys="User.role_id",
    )
    dimension_weights: Mapped[list["RoleDimensionWeight"]] = relationship(
        "RoleDimensionWeight",
        back_populates="role",
        foreign_keys="RoleDimensionWeight.role_id",
    )
    role_permissions: Mapped[list["RolePermission"]] = relationship(
        "RolePermission",
        back_populates="role",
        foreign_keys="RolePermission.role_id",
    )
