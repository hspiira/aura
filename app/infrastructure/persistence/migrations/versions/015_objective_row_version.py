"""Add row_version column to objectives for optimistic locking.

Revision ID: 015
Revises: 014
Create Date: Add row_version to objectives

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "015"
down_revision: str | Sequence[str] | None = "014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add row_version column with default 0."""
    op.add_column(
        "objectives",
        sa.Column("row_version", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column(
        "objectives",
        "row_version",
        server_default=None,
    )


def downgrade() -> None:
    """Remove row_version column."""
    op.drop_column("objectives", "row_version")
