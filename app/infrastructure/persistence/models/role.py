"""Role ORM model."""

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Numeric, String
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
    """Role table. Tied to department; has default dimension weights.

    hierarchy_level drives scoring behaviour:
      - executive:         CEO / board-level (team_weight_pct default 60)
      - senior_management: COO / CFO / Directors (team_weight_pct default 50)
      - middle_management: Department Managers / Team Leads (team_weight_pct default 30)
      - staff:             Individual contributors (team_weight_pct = 0)

    team_weight_pct: what % of the final appraisal score comes from the
    average performance of direct reports. The remainder (100 - team_weight_pct)
    comes from the individual's own objectives.
    """

    __tablename__ = "roles"
    __table_args__ = (
        CheckConstraint(
            "hierarchy_level IN ('executive', 'senior_management', 'middle_management', 'staff')",
            name="ck_roles_hierarchy_level",
        ),
        CheckConstraint(
            "team_weight_pct >= 0 AND team_weight_pct <= 100",
            name="ck_roles_team_weight_pct_range",
        ),
    )

    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_managerial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Hierarchy tier — controls cascade scoring and approval routing
    # User-facing label: "Executive", "Senior Management", "Manager", "Staff"
    hierarchy_level: Mapped[str] = mapped_column(
        String(32), nullable=False, default="staff"
    )

    # % of final score contributed by direct reports' average performance
    # staff = 0 (pure individual), manager = 30, senior = 50, executive = 60
    team_weight_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )

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
