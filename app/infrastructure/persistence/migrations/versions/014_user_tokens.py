"""Add user_tokens table for per-user auth tokens.

Revision ID: 014
Revises: 013
Create Date: Add user_tokens table

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "014"
down_revision: str | Sequence[str] | None = "013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create user_tokens table."""
    op.create_table(
        "user_tokens",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(length=256), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")
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
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_tokens_user_id",
        "user_tokens",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_tokens_token_hash",
        "user_tokens",
        ["token_hash"],
        unique=True,
    )


def downgrade() -> None:
    """Drop user_tokens table."""
    op.drop_index("ix_user_tokens_token_hash", table_name="user_tokens")
    op.drop_index("ix_user_tokens_user_id", table_name="user_tokens")
    op.drop_table("user_tokens")
