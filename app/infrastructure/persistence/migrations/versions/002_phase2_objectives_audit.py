"""Phase 2: objective_templates, objectives, updates, evidence, scores, audit_logs.

Revision ID: 002
Revises: 001
Create Date: Phase 2

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: str | Sequence[str] | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create Phase 2 tables."""
    op.create_table(
        "objective_templates",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column(
            "dimension_id",
            sa.String(),
            nullable=False,
        ),
        sa.Column("kpi_type", sa.String(length=64), nullable=True),
        sa.Column(
            "default_weight",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
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
        sa.UniqueConstraint("code", name="objective_templates_code_key"),
        sa.ForeignKeyConstraint(
            ["dimension_id"],
            ["performance_dimensions.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_table(
        "objectives",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("performance_cycle_id", sa.String(), nullable=False),
        sa.Column("dimension_id", sa.String(), nullable=False),
        sa.Column("template_id", sa.String(), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("kpi_type", sa.String(length=64), nullable=True),
        sa.Column("target_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("unit_of_measure", sa.String(length=64), nullable=True),
        sa.Column("weight", sa.Numeric(5, 2), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
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
            ["dimension_id"],
            ["performance_dimensions.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["objective_templates.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_table(
        "objective_updates",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("objective_id", sa.String(), nullable=False),
        sa.Column("actual_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("comment", sa.String(length=2000), nullable=True),
        sa.Column("submitted_by", sa.String(), nullable=False),
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
            ["objective_id"], ["objectives.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_table(
        "objective_evidence",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("objective_id", sa.String(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("file_path", sa.String(length=1024), nullable=True),
        sa.Column("uploaded_by", sa.String(), nullable=False),
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
            ["objective_id"], ["objectives.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_table(
        "objective_scores",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("objective_id", sa.String(), nullable=False),
        sa.Column(
            "achievement_percentage",
            sa.Numeric(6, 2),
            nullable=False,
        ),
        sa.Column("weighted_score", sa.Numeric(8, 2), nullable=False),
        sa.Column(
            "calculated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "locked",
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
        sa.UniqueConstraint("objective_id", name="objective_scores_objective_id_key"),
        sa.ForeignKeyConstraint(
            ["objective_id"], ["objectives.id"], ondelete="CASCADE"
        ),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(length=128), nullable=False),
        sa.Column("entity_id", sa.String(length=128), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("changed_by", sa.String(length=128), nullable=True),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop Phase 2 tables."""
    op.drop_table("audit_logs")
    op.drop_table("objective_scores")
    op.drop_table("objective_evidence")
    op.drop_table("objective_updates")
    op.drop_table("objectives")
    op.drop_table("objective_templates")
