"""Scoring engine: achievement % and weighted score with completion type support.

Completion types:
  numeric    → (actual / target) × 100, capped [0, 150]  (default, spec B.3)
  binary     → 0% if actual < 1, else 100%  (done/not done)
  percentage → actual value IS the %, capped [0, 150]
  milestone  → actual must be one of 0, 25, 50, 75, 100

Cascade summary:
  final_score = (own_score × own_weight%) + (team_score × team_weight%)
  where own_weight = 100 - team_weight_pct
"""

from dataclasses import dataclass
from decimal import Decimal

ACHIEVEMENT_CAP_MIN = Decimal("0")
ACHIEVEMENT_CAP_MAX = Decimal("150")

VALID_MILESTONE_VALUES = {
    Decimal("0"),
    Decimal("25"),
    Decimal("50"),
    Decimal("75"),
    Decimal("100"),
}

# Hierarchy ordering for bottom-up cascade computation
HIERARCHY_ORDER = {
    "staff": 0,
    "middle_management": 1,
    "senior_management": 2,
    "executive": 3,
}


@dataclass(frozen=True)
class ScoreResult:
    """Computed achievement % and weighted score."""

    achievement_percentage: Decimal
    weighted_score: Decimal


@dataclass(frozen=True)
class CascadeScoreResult:
    """Cascade-aware performance summary score components."""

    own_score: Decimal
    team_score: Decimal | None        # None for staff (no team weight)
    team_weight_pct_used: Decimal
    final_weighted_score: Decimal


def compute_score(
    *,
    target_value: Decimal | None,
    actual_value: Decimal | None,
    weight: Decimal,
    completion_type: str = "numeric",
) -> ScoreResult:
    """Compute achievement % and weighted score.

    Args:
        target_value: The goal value (required for numeric; ignored for others).
        actual_value: The achieved value (or None if not yet updated).
        weight: The objective's weight within its dimension (0–100).
        completion_type: One of "numeric", "binary", "percentage", "milestone".

    Returns:
        ScoreResult with achievement_percentage (0–150) and weighted_score.
    """
    pct: Decimal

    if actual_value is None:
        pct = ACHIEVEMENT_CAP_MIN

    elif completion_type == "binary":
        # Done (≥1) = 100%, not done = 0%
        pct = Decimal("100") if actual_value >= Decimal("1") else ACHIEVEMENT_CAP_MIN

    elif completion_type == "percentage":
        # User enters the % directly (e.g., "uptime was 99.5%")
        pct = actual_value
        if pct < ACHIEVEMENT_CAP_MIN:
            pct = ACHIEVEMENT_CAP_MIN
        elif pct > ACHIEVEMENT_CAP_MAX:
            pct = ACHIEVEMENT_CAP_MAX

    elif completion_type == "milestone":
        # Stepped progress: must be one of 0, 25, 50, 75, 100
        # Clamp to nearest valid value silently; validation enforced at update time
        pct = actual_value
        if pct < ACHIEVEMENT_CAP_MIN:
            pct = ACHIEVEMENT_CAP_MIN
        elif pct > Decimal("100"):
            pct = Decimal("100")

    else:
        # Default: numeric ratio (actual / target) × 100
        if target_value is None or target_value == 0:
            pct = ACHIEVEMENT_CAP_MIN
        else:
            pct = (actual_value / target_value) * 100
            if pct < ACHIEVEMENT_CAP_MIN:
                pct = ACHIEVEMENT_CAP_MIN
            elif pct > ACHIEVEMENT_CAP_MAX:
                pct = ACHIEVEMENT_CAP_MAX

    weighted = (pct * weight) / 100
    return ScoreResult(
        achievement_percentage=round(pct, 2),
        weighted_score=round(weighted, 2),
    )


def compute_cascade_final_score(
    *,
    own_score: Decimal,
    team_score: Decimal | None,
    team_weight_pct: Decimal,
) -> CascadeScoreResult:
    """Compute the final weighted score including team contribution.

    For staff (team_weight_pct = 0):
      final = own_score

    For managers and above:
      own_weight  = 100 - team_weight_pct
      final = (own_score × own_weight/100) + (team_score × team_weight_pct/100)

    Args:
        own_score: The individual's personal objective score (0–100+).
        team_score: Average of direct reports' final_weighted_scores.
                    Pass None if there are no direct reports.
        team_weight_pct: % of final score from team (from Role.team_weight_pct).

    Returns:
        CascadeScoreResult with all components and the final score.
    """
    if team_weight_pct <= Decimal("0") or team_score is None:
        return CascadeScoreResult(
            own_score=round(own_score, 2),
            team_score=None,
            team_weight_pct_used=Decimal("0"),
            final_weighted_score=round(own_score, 2),
        )

    own_weight = (Decimal("100") - team_weight_pct) / Decimal("100")
    team_weight = team_weight_pct / Decimal("100")
    final = (own_score * own_weight) + (team_score * team_weight)

    return CascadeScoreResult(
        own_score=round(own_score, 2),
        team_score=round(team_score, 2),
        team_weight_pct_used=team_weight_pct,
        final_weighted_score=round(final, 2),
    )


def validate_milestone_value(value: Decimal) -> bool:
    """Return True if value is a valid milestone step (0, 25, 50, 75, 100)."""
    return value in VALID_MILESTONE_VALUES


def hierarchy_sort_key(hierarchy_level: str) -> int:
    """Return sort key for bottom-up cascade computation ordering.

    Lower number = computed first.
    Staff (0) → Middle Management (1) → Senior Management (2) → Executive (3)
    """
    return HIERARCHY_ORDER.get(hierarchy_level, 0)


@dataclass(frozen=True)
class ActivityScoreResult:
    """Scored activities' weighted contribution to the parent KPI."""

    activity_scores: dict[str, ScoreResult]  # activity_id → ScoreResult
    kpi_achievement_percentage: Decimal       # weighted avg of activity scores
    kpi_weighted_score: Decimal              # scaled by KPI's own weight in dimension


def compute_kpi_from_activities(
    *,
    activities: list[dict],
    kpi_weight: Decimal,
) -> ActivityScoreResult:
    """Compute a KPI's achievement from its scored activities.

    Only "scored" activities with a non-None weight are included.
    Weights are normalised across scored activities so they sum to 100%.

    Args:
        activities: List of dicts with keys:
          - id (str): activity identifier
          - activity_type (str): "scored" | "task"
          - weight (Decimal | None): raw weight value from CSV / DB
          - target_value (Decimal | None)
          - actual_value (Decimal | None)
          - completion_type (str): default "numeric"
        kpi_weight: The parent KPI's weight within its dimension.

    Returns:
        ActivityScoreResult with per-activity scores and the KPI-level result.
    """
    scored = [
        a for a in activities
        if a.get("activity_type") == "scored" and a.get("weight") is not None
    ]

    if not scored:
        # No scored activities — return zeros; caller should fall back to KPI-level scoring
        return ActivityScoreResult(
            activity_scores={},
            kpi_achievement_percentage=ACHIEVEMENT_CAP_MIN,
            kpi_weighted_score=ACHIEVEMENT_CAP_MIN,
        )

    # Normalise weights to sum to 100%
    total_raw_weight = sum(a["weight"] for a in scored)
    if total_raw_weight == 0:
        total_raw_weight = Decimal("1")  # prevent division by zero

    results: dict[str, ScoreResult] = {}
    kpi_achievement = Decimal("0")

    for act in scored:
        normalised_weight = (act["weight"] / total_raw_weight) * Decimal("100")
        score = compute_score(
            target_value=act.get("target_value"),
            actual_value=act.get("actual_value"),
            weight=normalised_weight,
            completion_type=act.get("completion_type", "numeric"),
        )
        results[act["id"]] = score
        kpi_achievement += score.weighted_score  # sum of (ach% × normalised_weight / 100)

    # kpi_achievement is now the weighted avg achievement % of this KPI
    # Apply KPI's own weight in the dimension
    kpi_weighted = (kpi_achievement * kpi_weight) / Decimal("100")

    return ActivityScoreResult(
        activity_scores=results,
        kpi_achievement_percentage=round(kpi_achievement, 2),
        kpi_weighted_score=round(kpi_weighted, 2),
    )
