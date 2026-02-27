"""Add password and SSO identity support to users.

Revision ID: 018
Revises: 017
Create Date: Add password_hash, is_active, and user_identities.

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "018"
down_revision: str | Sequence[str] | None = "017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add password and SSO identity support."""
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    op.create_table(
        "user_identities",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_identities_user_id",
        "user_identities",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ux_user_identities_provider_subject",
        "user_identities",
        ["provider", "subject"],
        unique=True,
    )


def downgrade() -> None:
    """Revert password and SSO identity support."""
    op.drop_index(
        "ux_user_identities_provider_subject",
        table_name="user_identities",
    )
    op.drop_index(
        "ix_user_identities_user_id",
        table_name="user_identities",
    )
    op.drop_table("user_identities")

    op.drop_column("users", "is_active")
    op.drop_column("users", "password_hash")
