"""020 - ObjectiveActivity table (4th tier of performance hierarchy).

Revision ID: 020_objective_activities
Revises: 019_hierarchy_cascade_and_paf
Create Date: 2026-02-28

Adds:
  - objective_activities table with full scoring, status, and manager-verification support
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "020_objective_activities"
down_revision = "019_hierarchy_cascade_and_paf"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "objective_activities",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        # Parent KPI
        sa.Column(
            "objective_id",
            sa.String(36),
            sa.ForeignKey("objectives.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        # Identity
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        # Type: "scored" | "task"
        sa.Column("activity_type", sa.String(32), nullable=False, server_default="scored"),
        # Scoring
        sa.Column("weight", sa.Numeric(5, 2), nullable=True),
        sa.Column("completion_type", sa.String(32), nullable=False, server_default="numeric"),
        sa.Column("target_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("actual_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("unit_of_measure", sa.String(64), nullable=True),
        # Timeline
        sa.Column("due_date", sa.Date, nullable=True),
        # Status
        sa.Column("status", sa.String(32), nullable=False, server_default="not_started"),
        # Manager oversight
        sa.Column("manager_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "manager_verified_by",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("manager_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("manager_notes", sa.String(2000), nullable=True),
        # Display
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index(
        "ix_objective_activities_objective_id",
        "objective_activities",
        ["objective_id"],
    )
    op.create_check_constraint(
        "ck_objective_activities_type",
        "objective_activities",
        "activity_type IN ('scored', 'task')",
    )
    op.create_check_constraint(
        "ck_objective_activities_status",
        "objective_activities",
        "status IN ('not_started', 'in_progress', 'completed', 'blocked')",
    )
    op.create_check_constraint(
        "ck_objective_activities_completion_type",
        "objective_activities",
        "completion_type IN ('numeric', 'binary', 'percentage', 'milestone')",
    )
    op.create_check_constraint(
        "ck_objective_activities_weight_range",
        "objective_activities",
        "weight IS NULL OR (weight >= 0 AND weight <= 100)",
    )


def downgrade() -> None:
    op.drop_index("ix_objective_activities_objective_id", "objective_activities")
    op.drop_table("objective_activities")
