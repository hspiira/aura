"""Phase 12: template versioning fields on objective_templates.

Revision ID: 012
Revises: 011
Create Date: Template versioning

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, Sequence[str], None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add version and optional superseded_by_id to objective_templates."""
    op.add_column(
        "objective_templates",
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "objective_templates",
        sa.Column("superseded_by_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_objective_templates_superseded_by",
        "objective_templates",
        "objective_templates",
        ["superseded_by_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Remove template versioning fields."""
    op.drop_constraint(
        "fk_objective_templates_superseded_by",
        "objective_templates",
        type_="foreignkey",
    )
    op.drop_column("objective_templates", "superseded_by_id")
    op.drop_column("objective_templates", "version")
