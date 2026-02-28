"""Phase 9: analytics star schema — fact_performance_summary, dim_*.

Revision ID: 008
Revises: 007
Create Date: Phase 9

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: str | Sequence[str] | None = "007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create analytics fact and dimension tables."""
    op.create_table(
        "fact_performance_summary",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("department_id", sa.String(length=128), nullable=False),
        sa.Column("role_id", sa.String(length=128), nullable=False),
        sa.Column("performance_cycle_id", sa.String(length=128), nullable=False),
        sa.Column("cycle_year", sa.Integer(), nullable=False),
        sa.Column("quantitative_score", sa.Numeric(10, 2), nullable=True),
        sa.Column("behavioral_score", sa.Numeric(6, 2), nullable=True),
        sa.Column("final_score", sa.Numeric(10, 2), nullable=True),
        sa.Column("rating_band", sa.String(length=64), nullable=True),
        sa.Column(
            "etl_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_fact_performance_summary_user_cycle",
        ),
    )
    op.create_index(
        "ix_fact_performance_summary_cycle_year",
        "fact_performance_summary",
        ["cycle_year"],
        unique=False,
    )
    op.create_index(
        "ix_fact_performance_summary_department_id",
        "fact_performance_summary",
        ["department_id"],
        unique=False,
    )

    op.create_table(
        "dim_cycle",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("cycle_id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cycle_year", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column(
            "etl_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "end_date >= start_date",
            name="ck_dim_cycle_end_after_start",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cycle_id", name="uq_dim_cycle_cycle_id"),
    )

    op.create_table(
        "dim_time",
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("quarter", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=32), nullable=True),
        sa.CheckConstraint(
            "quarter >= 1 AND quarter <= 4",
            name="ck_dim_time_quarter_1_4",
        ),
        sa.PrimaryKeyConstraint("year", "quarter"),
    )


def downgrade() -> None:
    """Drop analytics tables."""
    op.drop_index(
        "ix_fact_performance_summary_department_id",
        table_name="fact_performance_summary",
    )
    op.drop_index(
        "ix_fact_performance_summary_cycle_year",
        table_name="fact_performance_summary",
    )
    op.drop_table("fact_performance_summary")
    op.drop_table("dim_cycle")
    op.drop_table("dim_time")
