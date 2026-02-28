"""019 - Staff hierarchy, performance cascade, PAF improvements.

Revision ID: 019_hierarchy_cascade_and_paf
Revises: 018_jwt_auth
Create Date: 2026-02-28

Changes:
  1. roles          → add hierarchy_level, team_weight_pct
  2. objectives     → add group_id, cascade_level, cascade_parent_id, completion_type
  3. performance_summaries → add own_score, team_score, team_weight_pct_used,
                             rating_value, employee_acknowledged, employee_acknowledged_at
  4. reward_policies → add rating_label, rating_value, color_hex
  5. NEW TABLE: objective_groups
  6. NEW TABLE: self_assessments
  7. NEW TABLE: development_goals
  8. NEW TABLE: employee_acknowledgments
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "019_hierarchy_cascade_and_paf"
down_revision = "018_jwt_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─────────────────────────────────────────────────────────────────────────
    # 1. roles — hierarchy_level and team_weight_pct
    # ─────────────────────────────────────────────────────────────────────────
    op.add_column(
        "roles",
        sa.Column(
            "hierarchy_level",
            sa.String(32),
            nullable=False,
            server_default="staff",
        ),
    )
    op.add_column(
        "roles",
        sa.Column(
            "team_weight_pct",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.create_check_constraint(
        "ck_roles_hierarchy_level",
        "roles",
        "hierarchy_level IN ('executive', 'senior_management', 'middle_management', 'staff')",
    )
    op.create_check_constraint(
        "ck_roles_team_weight_pct_range",
        "roles",
        "team_weight_pct >= 0 AND team_weight_pct <= 100",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. NEW TABLE: objective_groups
    # ─────────────────────────────────────────────────────────────────────────
    op.create_table(
        "objective_groups",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "dimension_id",
            sa.String(36),
            sa.ForeignKey("performance_dimensions.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("default_weight_pct", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )
    op.create_index("ix_objective_groups_dimension_id", "objective_groups", ["dimension_id"])

    # ─────────────────────────────────────────────────────────────────────────
    # 3. objectives — group_id, cascade fields, completion_type
    # ─────────────────────────────────────────────────────────────────────────
    op.add_column(
        "objectives",
        sa.Column(
            "group_id",
            sa.String(36),
            sa.ForeignKey("objective_groups.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_objectives_group_id", "objectives", ["group_id"])

    op.add_column(
        "objectives",
        sa.Column(
            "cascade_level",
            sa.String(32),
            nullable=False,
            server_default="individual",
        ),
    )
    op.add_column(
        "objectives",
        sa.Column(
            "cascade_parent_id",
            sa.String(36),
            sa.ForeignKey("objectives.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_objectives_cascade_parent_id", "objectives", ["cascade_parent_id"])

    op.add_column(
        "objectives",
        sa.Column(
            "completion_type",
            sa.String(32),
            nullable=False,
            server_default="numeric",
        ),
    )
    op.create_check_constraint(
        "ck_objectives_cascade_level",
        "objectives",
        "cascade_level IN ('company', 'division', 'department', 'individual')",
    )
    op.create_check_constraint(
        "ck_objectives_completion_type",
        "objectives",
        "completion_type IN ('numeric', 'binary', 'percentage', 'milestone')",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. performance_summaries — cascade score fields + acknowledgment
    # ─────────────────────────────────────────────────────────────────────────
    op.add_column(
        "performance_summaries",
        sa.Column("own_score", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "performance_summaries",
        sa.Column("team_score", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "performance_summaries",
        sa.Column("team_weight_pct_used", sa.Numeric(5, 2), nullable=True),
    )
    op.add_column(
        "performance_summaries",
        sa.Column("rating_value", sa.Integer, nullable=True),
    )
    op.add_column(
        "performance_summaries",
        sa.Column(
            "employee_acknowledged",
            sa.Boolean,
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "performance_summaries",
        sa.Column("employee_acknowledged_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. reward_policies — rating_label, rating_value, color_hex
    # ─────────────────────────────────────────────────────────────────────────
    op.add_column(
        "reward_policies",
        sa.Column("rating_label", sa.String(128), nullable=True),
    )
    op.add_column(
        "reward_policies",
        sa.Column("rating_value", sa.Integer, nullable=True),
    )
    op.add_column(
        "reward_policies",
        sa.Column("color_hex", sa.String(16), nullable=True),
    )
    op.create_check_constraint(
        "ck_reward_policies_rating_value_range",
        "reward_policies",
        "rating_value IS NULL OR (rating_value >= 1 AND rating_value <= 5)",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 6. NEW TABLE: self_assessments
    # ─────────────────────────────────────────────────────────────────────────
    op.create_table(
        "self_assessments",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "performance_cycle_id",
            sa.String(36),
            sa.ForeignKey("performance_cycles.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("self_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("self_rating_value", sa.Integer, nullable=True),
        sa.Column("strengths", sa.Text, nullable=True),
        sa.Column("development_areas", sa.Text, nullable=True),
        sa.Column("career_aspirations", sa.Text, nullable=True),
        sa.Column("support_needed", sa.Text, nullable=True),
        sa.Column("overall_comment", sa.Text, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("manager_agrees", sa.Boolean, nullable=True),
        sa.Column("manager_response", sa.Text, nullable=True),
        sa.Column("manager_responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "performance_cycle_id", name="uq_self_assessments_user_cycle"),
    )
    op.create_check_constraint(
        "ck_self_assessments_status",
        "self_assessments",
        "status IN ('draft', 'submitted')",
    )
    op.create_check_constraint(
        "ck_self_assessments_rating_range",
        "self_assessments",
        "self_rating_value IS NULL OR (self_rating_value >= 1 AND self_rating_value <= 5)",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 7. NEW TABLE: development_goals
    # ─────────────────────────────────────────────────────────────────────────
    op.create_table(
        "development_goals",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "performance_cycle_id",
            sa.String(36),
            sa.ForeignKey("performance_cycles.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("area", sa.String(255), nullable=False),
        sa.Column("goal", sa.String(1000), nullable=False),
        sa.Column("action_plan", sa.Text, nullable=True),
        sa.Column("support_required", sa.String(1000), nullable=True),
        sa.Column("target_completion", sa.Date, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="planned"),
        sa.Column("outcome", sa.Text, nullable=True),
        sa.Column("potential_rating", sa.String(64), nullable=True),
        sa.Column("readiness_timeline", sa.String(500), nullable=True),
        sa.Column(
            "manager_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_development_goals_status",
        "development_goals",
        "status IN ('planned', 'in_progress', 'completed', 'deferred')",
    )
    op.create_check_constraint(
        "ck_development_goals_potential",
        "development_goals",
        "potential_rating IS NULL OR potential_rating IN "
        "('high', 'medium', 'low', 'promotable', 'ready_now', 'ready_1yr', 'ready_2yr_plus')",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 8. NEW TABLE: employee_acknowledgments
    # ─────────────────────────────────────────────────────────────────────────
    op.create_table(
        "employee_acknowledgments",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "performance_cycle_id",
            sa.String(36),
            sa.ForeignKey("performance_cycles.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "performance_summary_id",
            sa.String(36),
            sa.ForeignKey("performance_summaries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("acknowledged", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("employee_comment", sa.Text, nullable=True),
        sa.Column("agrees_with_rating", sa.Boolean, nullable=True),
        sa.Column("dispute_reason", sa.Text, nullable=True),
        sa.Column("dispute_resolved", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("dispute_resolution_notes", sa.String(2000), nullable=True),
        sa.Column(
            "dispute_resolved_by",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("dispute_resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "user_id",
            "performance_cycle_id",
            name="uq_employee_acknowledgments_user_cycle",
        ),
    )


def downgrade() -> None:
    # Drop new tables (reverse order of creation)
    op.drop_table("employee_acknowledgments")
    op.drop_table("development_goals")
    op.drop_table("self_assessments")

    # Drop reward_policies additions
    op.drop_constraint("ck_reward_policies_rating_value_range", "reward_policies", type_="check")
    op.drop_column("reward_policies", "color_hex")
    op.drop_column("reward_policies", "rating_value")
    op.drop_column("reward_policies", "rating_label")

    # Drop performance_summaries additions
    op.drop_column("performance_summaries", "employee_acknowledged_at")
    op.drop_column("performance_summaries", "employee_acknowledged")
    op.drop_column("performance_summaries", "rating_value")
    op.drop_column("performance_summaries", "team_weight_pct_used")
    op.drop_column("performance_summaries", "team_score")
    op.drop_column("performance_summaries", "own_score")

    # Drop objectives additions
    op.drop_constraint("ck_objectives_completion_type", "objectives", type_="check")
    op.drop_constraint("ck_objectives_cascade_level", "objectives", type_="check")
    op.drop_index("ix_objectives_cascade_parent_id", "objectives")
    op.drop_index("ix_objectives_group_id", "objectives")
    op.drop_column("objectives", "completion_type")
    op.drop_column("objectives", "cascade_parent_id")
    op.drop_column("objectives", "cascade_level")
    op.drop_column("objectives", "group_id")

    # Drop objective_groups table
    op.drop_index("ix_objective_groups_dimension_id", "objective_groups")
    op.drop_table("objective_groups")

    # Drop roles additions
    op.drop_constraint("ck_roles_team_weight_pct_range", "roles", type_="check")
    op.drop_constraint("ck_roles_hierarchy_level", "roles", type_="check")
    op.drop_column("roles", "team_weight_pct")
    op.drop_column("roles", "hierarchy_level")
