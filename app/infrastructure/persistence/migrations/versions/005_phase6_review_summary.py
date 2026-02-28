"""Phase 6: performance_summaries, review_sessions.

Revision ID: 005
Revises: 004
Create Date: Phase 6

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: str | Sequence[str] | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create performance_summaries and review_sessions."""
    op.create_table(
        "performance_summaries",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("quantitative_score", sa.Numeric(10, 2), nullable=True),
        sa.Column("behavioral_score", sa.Numeric(6, 2), nullable=True),
        sa.Column("final_weighted_score", sa.Numeric(10, 2), nullable=True),
        sa.Column("final_rating_band", sa.String(length=64), nullable=True),
        sa.Column("manager_comment", sa.String(length=2000), nullable=True),
        sa.Column("employee_comment", sa.String(length=2000), nullable=True),
        sa.Column(
            "hr_approved",
            sa.Boolean(),
            nullable=False,
            server_default="false",
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["performance_cycle_id"],
            ["performance_cycles.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_performance_summaries_user_cycle",
        ),
    )
    op.create_table(
        "review_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("reviewer_id", sa.String(), nullable=False),
        sa.Column("session_type", sa.String(length=64), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
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
            ["reviewer_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_index(
        "ix_review_sessions_user_cycle",
        "review_sessions",
        ["user_id", "performance_cycle_id"],
    )
    op.create_index(
        "ix_review_sessions_reviewer_id",
        "review_sessions",
        ["reviewer_id"],
    )


def downgrade() -> None:
    """Drop review_sessions and performance_summaries."""
    op.drop_index(
        "ix_review_sessions_reviewer_id",
        table_name="review_sessions",
    )
    op.drop_index(
        "ix_review_sessions_user_cycle",
        table_name="review_sessions",
    )
    op.drop_table("review_sessions")
    op.drop_table("performance_summaries")
