"""Add status check constraint to objectives.

Revision ID: 017
Revises: 016
Create Date: Add status check constraint to objectives

"""

from collections.abc import Sequence

from alembic import op

revision: str = "017"
down_revision: str | Sequence[str] | None = "016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add check constraint for objectives.status."""
    op.create_check_constraint(
        "ck_objectives_status",
        "objectives",
        "status IN ('draft','submitted','rejected','approved','active',"
        "'at_risk','completed','under_review','closed')",
    )


def downgrade() -> None:
    """Remove check constraint for objectives.status."""
    op.drop_constraint("ck_objectives_status", "objectives")
