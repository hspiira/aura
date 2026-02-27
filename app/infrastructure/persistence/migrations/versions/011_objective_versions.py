"""Phase 11: objective_versions history table for amendments.

Revision ID: 011
Revises: 010
Create Date: Objective versions history

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, Sequence[str], None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create objective_versions table for amendment history."""
    op.create_table(
        "objective_versions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("objective_id", sa.String(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("target_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("weight", sa.Numeric(5, 2), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("amended_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("amended_by", sa.String(), nullable=True),
        sa.Column("justification", sa.String(length=2000), nullable=True),
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
            ["objective_id"],
            ["objectives.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_objective_versions_objective_id_version",
        "objective_versions",
        ["objective_id", "version"],
        unique=True,
    )


def downgrade() -> None:
    """Drop objective_versions table."""
    op.drop_index(
        "ix_objective_versions_objective_id_version",
        table_name="objective_versions",
    )
    op.drop_table("objective_versions")
