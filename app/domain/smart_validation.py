"""SMART validation for objectives (spec C.2)."""

from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from datetime import date

    from app.infrastructure.persistence.models.baseline_snapshot import (
        BaselineSnapshot,
    )
    from app.infrastructure.persistence.models.objective_template import (
        ObjectiveTemplate,
    )


TITLE_MIN_LENGTH = 10
WEIGHT_TOTAL_TARGET = Decimal("100")
MAX_CUSTOM_WEIGHT = Decimal("30")
LOWER_TARGET_THRESHOLD = Decimal("0.8")  # new target < 80% of last achievement


@dataclass(frozen=True)
class ValidationResult:
    """Result of SMART validation."""

    valid: bool
    errors: list[str]


def validate_objective(
    *,
    title: str,
    kpi_type: str | None,
    target_value: Decimal | None,
    weight: Decimal,
    start_date: "date",
    end_date: "date",
    cycle_start: "date",
    cycle_end: "date",
    template: "ObjectiveTemplate | None" = None,
    other_weights_sum: Decimal = Decimal("0"),
    has_baseline_for_template: bool = False,
    last_achievement_value: Decimal | None = None,
    justification_for_lower_target: str | None = None,
    is_custom_objective: bool = False,
    max_custom_weight: Decimal = MAX_CUSTOM_WEIGHT,
    is_behavioral_dimension: bool = False,
) -> ValidationResult:
    """Run SMART validation; returns ValidationResult(valid, errors).

    has_baseline_for_template defaults to False so that callers must explicitly
    pass True when a baseline exists; otherwise template.requires_baseline_snapshot
    is enforced (fail closed).

    Anti-gaming: if target < 80%% of last achievement, justification required;
    custom objectives max weight 30%%; free-text (no template) only for Behavioral.
    """
    errors: list[str] = []

    if len(title) < TITLE_MIN_LENGTH:
        errors.append(f"title must be at least {TITLE_MIN_LENGTH} characters")

    if template and template.kpi_type:
        if not kpi_type:
            errors.append("kpi_type is required when template defines kpi_type")
        elif kpi_type != template.kpi_type:
            errors.append(
                f"kpi_type must match template kpi_type ({template.kpi_type})"
            )

    requires_target_value = (
        template is None or (template and template.kpi_type) or kpi_type
    )
    if target_value is None and requires_target_value:
        errors.append("target_value is required for quantitative objectives")

    if template and target_value is not None:
        if template.min_target is not None and target_value < template.min_target:
            errors.append(
                f"target_value {target_value} below template min_target "
                f"{template.min_target}"
            )
        if template.max_target is not None and target_value > template.max_target:
            errors.append(
                f"target_value {target_value} above template max_target "
                f"{template.max_target}"
            )

    total_weight = other_weights_sum + weight
    if total_weight != WEIGHT_TOTAL_TARGET:
        errors.append(
            f"weight total must be {WEIGHT_TOTAL_TARGET}% "
            f"(current: {total_weight}% with this objective)"
        )

    if start_date < cycle_start:
        errors.append(
            f"start_date {start_date} must be on or after cycle start {cycle_start}"
        )
    if end_date > cycle_end:
        errors.append(f"end_date {end_date} must be on or before cycle end {cycle_end}")
    if start_date > end_date:
        errors.append("start_date must be before or equal to end_date")

    if (
        template
        and template.requires_baseline_snapshot
        and not has_baseline_for_template
    ):
        errors.append("template requires a baseline snapshot for this user/cycle")

    # Anti-gaming: new target >20% below last achievement requires justification
    if (
        last_achievement_value is not None
        and target_value is not None
        and last_achievement_value > 0
        and target_value < last_achievement_value * LOWER_TARGET_THRESHOLD
    ):
        if not (justification_for_lower_target or "").strip():
            errors.append(
                "target more than 20% below last achievement requires a justification"
            )

    # Anti-gaming: custom objectives max 30% weight
    if is_custom_objective and weight > max_custom_weight:
        errors.append(
            f"custom objectives may not exceed {max_custom_weight}% weight "
            f"(current: {weight}%)"
        )

    # Anti-gaming: free-text (no template) only allowed for Behavioral dimension
    if not is_behavioral_dimension and template is None:
        errors.append(
            "free-text objectives (no template) are only allowed "
            "for Behavioral dimension"
        )

    return ValidationResult(valid=len(errors) == 0, errors=errors)


def has_baseline_for_user_cycle_template(
    baseline_snapshots: list["BaselineSnapshot"],
    user_id: str,
    performance_cycle_id: str,
    template_id: str,
) -> bool:
    """Return True if a baseline exists for the given user, cycle, and template."""
    for b in baseline_snapshots:
        if (
            b.user_id == user_id
            and b.performance_cycle_id == performance_cycle_id
            and b.template_id == template_id
        ):
            return True
    return False
