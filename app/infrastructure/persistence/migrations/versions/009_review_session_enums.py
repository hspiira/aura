"""Constrain review_sessions.session_type and status to enums.

Revision ID: 009
Revises: 008
Create Date: Phase 9 follow-up

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.domain.review_session import ReviewSessionStatus, ReviewSessionType

revision: str = "009"
down_revision: str | Sequence[str] | None = "008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Alter review_sessions session_type and status to enum-backed string columns."""
    op.alter_column(
        "review_sessions",
        "session_type",
        existing_type=sa.String(length=64),
        type_=sa.Enum(ReviewSessionType, native_enum=False),
        existing_nullable=False,
    )
    op.alter_column(
        "review_sessions",
        "status",
        existing_type=sa.String(length=32),
        type_=sa.Enum(ReviewSessionStatus, native_enum=False),
        existing_nullable=False,
        existing_server_default=sa.text("'scheduled'"),
    )


def downgrade() -> None:
    """Revert session_type and status to plain strings."""
    op.alter_column(
        "review_sessions",
        "session_type",
        existing_type=sa.Enum(ReviewSessionType, native_enum=False),
        type_=sa.String(length=64),
        existing_nullable=False,
    )
    op.alter_column(
        "review_sessions",
        "status",
        existing_type=sa.Enum(ReviewSessionStatus, native_enum=False),
        type_=sa.String(length=32),
        existing_nullable=False,
        existing_server_default=sa.text("'scheduled'"),
    )
