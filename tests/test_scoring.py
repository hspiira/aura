"""Unit tests for scoring domain."""

from decimal import Decimal

from app.domain.scoring import ACHIEVEMENT_CAP_MAX, compute_score


def test_compute_score_basic() -> None:
    """Achievement % = (actual/target)*100, weighted = pct * weight / 100."""
    result = compute_score(
        target_value=Decimal("100"),
        actual_value=Decimal("80"),
        weight=Decimal("20"),
    )
    assert result.achievement_percentage == Decimal("80.00")
    assert result.weighted_score == Decimal("16.00")


def test_compute_score_cap_150() -> None:
    """Achievement % is capped at 150."""
    result = compute_score(
        target_value=Decimal("100"),
        actual_value=Decimal("200"),
        weight=Decimal("10"),
    )
    assert result.achievement_percentage == ACHIEVEMENT_CAP_MAX
    assert result.weighted_score == Decimal("15.00")


def test_compute_score_zero_actual() -> None:
    """When actual is None or target is 0, achievement is 0."""
    result = compute_score(
        target_value=Decimal("100"),
        actual_value=None,
        weight=Decimal("20"),
    )
    assert result.achievement_percentage == Decimal("0")
    assert result.weighted_score == Decimal("0")

    result2 = compute_score(
        target_value=Decimal("0"),
        actual_value=Decimal("50"),
        weight=Decimal("20"),
    )
    assert result2.achievement_percentage == Decimal("0")
    assert result2.weighted_score == Decimal("0")


def test_compute_score_rounding() -> None:
    """Results are rounded to 2 decimal places."""
    result = compute_score(
        target_value=Decimal("3"),
        actual_value=Decimal("1"),
        weight=Decimal("33.33"),
    )
    assert result.achievement_percentage == Decimal("33.33")
    assert result.weighted_score == Decimal("11.11")
