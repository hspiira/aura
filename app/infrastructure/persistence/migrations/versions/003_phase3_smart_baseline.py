"""Phase 3: template min/max + requires_baseline_snapshot, baseline_snapshots table.

Revision ID: 003
Revises: 002
Create Date: Phase 3

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, Sequence[str], None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add template columns and create baseline_snapshots."""
    op.add_column(
        "objective_templates",
        sa.Column("min_target", sa.Numeric(20, 4), nullable=True),
    )
    op.add_column(
        "objective_templates",
        sa.Column("max_target", sa.Numeric(20, 4), nullable=True),
    )
    op.add_column(
        "objective_templates",
        sa.Column(
            "requires_baseline_snapshot",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.create_check_constraint(
        "ck_objective_templates_min_le_max",
        "objective_templates",
        "(min_target IS NULL) OR (max_target IS NULL) OR (min_target <= max_target)",
    )
    op.create_table(
        "baseline_snapshots",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("template_id", sa.String(), nullable=False),
        sa.Column("baseline_value", sa.Numeric(20, 4), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("data_source", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["performance_cycle_id"],
            ["performance_cycles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["objective_templates.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            "template_id",
            name="uq_baseline_snapshots_user_cycle_template",
        ),
    )


def downgrade() -> None:
    """Remove baseline_snapshots and template columns."""
    op.drop_table("baseline_snapshots")
    op.drop_constraint(
        "ck_objective_templates_min_le_max",
        "objective_templates",
        type_="check",
    )
    op.drop_column("objective_templates", "requires_baseline_snapshot")
    op.drop_column("objective_templates", "max_target")
    op.drop_column("objective_templates", "min_target")
