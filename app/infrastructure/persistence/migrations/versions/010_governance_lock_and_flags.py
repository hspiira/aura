"""Governance: objectives_lock_date, objectives_locked_at on cycles; objective_flags.

Revision ID: 010
Revises: 009
Create Date: Governance lock and 90-day flags

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, Sequence[str], None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add lock date and flags for governance jobs."""
    op.add_column(
        "performance_cycles",
        sa.Column("objectives_lock_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "performance_cycles",
        sa.Column(
            "objectives_locked_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.create_table(
        "objective_flags",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("objective_id", sa.String(), nullable=False),
        sa.Column("flag_type", sa.String(length=32), nullable=False),
        sa.Column(
            "set_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["objective_id"],
            ["objectives.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_objective_flags_objective_id",
        "objective_flags",
        ["objective_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove lock date and objective_flags."""
    op.drop_index(
        "ix_objective_flags_objective_id",
        table_name="objective_flags",
    )
    op.drop_table("objective_flags")
    op.drop_column("performance_cycles", "objectives_locked_at")
    op.drop_column("performance_cycles", "objectives_lock_date")
