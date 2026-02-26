"""Unit tests for SMART validation (no DB)."""

from datetime import date
from decimal import Decimal

from app.domain.smart_validation import validate_objective


def test_kpi_type_required_when_template_has_kpi_type() -> None:
    """Validation fails when template defines kpi_type but objective has none."""
    result = validate_objective(
        title="A long enough objective title here",
        kpi_type=None,
        target_value=Decimal("100"),
        weight=Decimal("100"),
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        cycle_start=date(2026, 1, 1),
        cycle_end=date(2026, 12, 31),
        template=_template(kpi_type="number"),
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("kpi_type is required" in e for e in result.errors)


def test_kpi_type_must_match_template() -> None:
    """Validation fails when objective kpi_type differs from template kpi_type."""
    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=Decimal("80"),
        weight=Decimal("100"),
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        cycle_start=date(2026, 1, 1),
        cycle_end=date(2026, 12, 31),
        template=_template(kpi_type="percent"),
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any(
        "kpi_type must match template" in e and "percent" in e for e in result.errors
    )


def test_target_value_required_when_objective_has_kpi_type() -> None:
    """Validation fails when objective kpi_type is set but target_value is missing."""
    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=None,
        weight=Decimal("100"),
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        cycle_start=date(2026, 1, 1),
        cycle_end=date(2026, 12, 31),
        template=_template(kpi_type=None),
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("target_value is required" in e for e in result.errors)


def test_kpi_type_matches_template_passes() -> None:
    """Validation passes when kpi_type matches template."""
    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="percent",
        target_value=Decimal("80"),
        weight=Decimal("100"),
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        cycle_start=date(2026, 1, 1),
        cycle_end=date(2026, 12, 31),
        template=_template(kpi_type="percent"),
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert "kpi_type" not in [e.lower() for e in result.errors]
    assert result.valid is True


def _template(kpi_type: str | None = "number") -> "SimpleNamespace":
    """Minimal template-like object for unit tests."""
    from types import SimpleNamespace

    return SimpleNamespace(
        kpi_type=kpi_type,
        min_target=Decimal("0"),
        max_target=Decimal("100"),
        requires_baseline_snapshot=False,
    )
