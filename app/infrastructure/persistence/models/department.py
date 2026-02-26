"""Department ORM model."""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.infrastructure.persistence.models.organization import Organization
    from app.infrastructure.persistence.models.role import Role
    from app.infrastructure.persistence.models.user import User


class Department(CuidMixin, TimestampMixin, Base):
    """Department table. Optional parent for hierarchy."""

    __tablename__ = "departments"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="departments",
        foreign_keys=[organization_id],
    )
    parent: Mapped["Department | None"] = relationship(
        "Department",
        remote_side="Department.id",
        back_populates="children",
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Department"]] = relationship(
        "Department",
        back_populates="parent",
        foreign_keys=[parent_id],
    )
    roles: Mapped[list["Role"]] = relationship(
        "Role",
        back_populates="department",
        foreign_keys="Role.department_id",
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="department",
        foreign_keys="User.department_id",
    )
