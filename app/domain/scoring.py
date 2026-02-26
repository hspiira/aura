"""Scoring engine: achievement % and weighted score (spec B.3)."""

from dataclasses import dataclass
from decimal import Decimal


ACHIEVEMENT_CAP_MIN = Decimal("0")
ACHIEVEMENT_CAP_MAX = Decimal("150")


@dataclass(frozen=True)
class ScoreResult:
    """Computed achievement % and weighted score."""

    achievement_percentage: Decimal
    weighted_score: Decimal


def compute_score(
    *,
    target_value: Decimal | None,
    actual_value: Decimal | None,
    weight: Decimal,
) -> ScoreResult:
    """Compute achievement % and weighted score.

    Achievement % = (actual / target) * 100, capped to [0, 150].
    Weighted score = (achievement_percentage * weight) / 100.
    If target is None or 0, or actual is None, achievement is 0.
    """
    if target_value is None or target_value == 0 or actual_value is None:
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
