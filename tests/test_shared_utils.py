"""Shared utils tests."""

from datetime import UTC, datetime

from app.shared.utils.datetime import (
    ensure_utc,
    from_timestamp_ms_utc,
    from_timestamp_utc,
    utc_now,
)
from app.shared.utils.generators import generate_cuid


def test_generate_cuid_returns_str() -> None:
    """generate_cuid returns a non-empty string."""
    c = generate_cuid()
    assert isinstance(c, str)
    assert len(c) > 0


def test_generate_cuid_unique() -> None:
    """generate_cuid returns unique values."""
    assert generate_cuid() != generate_cuid()


def test_utc_now_is_aware() -> None:
    """utc_now returns timezone-aware UTC datetime."""
    now = utc_now()
    assert now.tzinfo is not None
    assert now.tzinfo == UTC


def test_ensure_utc_none() -> None:
    """ensure_utc(None) returns None."""
    assert ensure_utc(None) is None


def test_ensure_utc_naive_assumes_utc() -> None:
    """ensure_utc(naive) attaches UTC."""
    naive = datetime(2026, 1, 1, 12, 0, 0)
    out = ensure_utc(naive)
    assert out is not None
    assert out.tzinfo == UTC
    assert out.year == 2026


def test_from_timestamp_utc() -> None:
    """from_timestamp_utc returns UTC-aware datetime."""
    # 2025-01-01 00:00:00 UTC
    ts = 1735689600.0
    dt = from_timestamp_utc(ts)
    assert dt.tzinfo == UTC
    assert dt.year == 2025
    assert dt.month == 1


def test_from_timestamp_ms_utc() -> None:
    """from_timestamp_ms_utc accepts milliseconds."""
    ts_ms = 1735689600000
    dt = from_timestamp_ms_utc(ts_ms)
    assert dt.tzinfo == UTC
    assert dt.year == 2025
