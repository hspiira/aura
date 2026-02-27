"""Add unique constraint on objective_flags (objective_id, flag_type).

Revision ID: 013
Revises: 012
Create Date: Ensure one flag per type per objective

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "013"
down_revision: str | Sequence[str] | None = "012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add unique constraint for objective_flags."""
    op.create_unique_constraint(
        "uq_objective_flag_type",
        "objective_flags",
        ["objective_id", "flag_type"],
    )


def downgrade() -> None:
    """Remove unique constraint for objective_flags."""
    op.drop_constraint(
        "uq_objective_flag_type",
        "objective_flags",
        type_="unique",
    )

