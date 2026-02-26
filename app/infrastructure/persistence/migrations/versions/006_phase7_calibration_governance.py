"""Phase 7: calibration_sessions, reward_policies.

Revision ID: 006
Revises: 005
Create Date: Phase 7

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, Sequence[str], None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create calibration_sessions and reward_policies."""
    op.create_table(
        "calibration_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("department_id", sa.String(), nullable=False),
        sa.Column("conducted_by_id", sa.String(), nullable=False),
        sa.Column("conducted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["performance_cycle_id"],
            ["performance_cycles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["department_id"],
            ["departments.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conducted_by_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_table(
        "reward_policies",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("min_score", sa.Numeric(10, 2), nullable=False),
        sa.Column("max_score", sa.Numeric(10, 2), nullable=False),
        sa.Column("reward_type", sa.String(length=64), nullable=False),
        sa.Column("reward_value", sa.String(length=255), nullable=False),
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
    )


def downgrade() -> None:
    """Drop reward_policies and calibration_sessions."""
    op.drop_table("reward_policies")
    op.drop_table("calibration_sessions")
