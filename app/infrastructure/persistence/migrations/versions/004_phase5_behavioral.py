"""Phase 5: behavioral_indicators, behavioral_scores.

Revision ID: 004
Revises: 003
Create Date: Phase 5

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, Sequence[str], None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create behavioral_indicators and behavioral_scores."""
    op.create_table(
        "behavioral_indicators",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dimension_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column(
            "rating_scale_min",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "rating_scale_max",
            sa.Integer(),
            nullable=False,
            server_default="5",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
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
            ["dimension_id"],
            ["performance_dimensions.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_table(
        "behavioral_scores",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("indicator_id", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("manager_comment", sa.String(length=2000), nullable=True),
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
            ["indicator_id"],
            ["behavioral_indicators.id"],
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            "indicator_id",
            name="uq_behavioral_scores_user_cycle_indicator",
        ),
    )


def downgrade() -> None:
    """Drop behavioral_scores and behavioral_indicators."""
    op.drop_table("behavioral_scores")
    op.drop_table("behavioral_indicators")
