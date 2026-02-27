"""DB-backed tests for fact_performance_summary repository (analytics ETL)."""

from decimal import Decimal

import pytest

from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_fact_performance_summary_upsert_inserts_when_no_existing(
    db_session, seed_phase1
) -> None:
    """upsert inserts when no row exists for user_id + performance_cycle_id."""
    repo = FactPerformanceSummaryRepository(db_session)
    fact = FactPerformanceSummary(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        role_id=seed_phase1["role_id"],
        cycle_year=2026,
        quantitative_score=Decimal("70"),
        behavioral_score=Decimal("80"),
        final_score=Decimal("75"),
        rating_band="meets",
    )
    out = await repo.upsert(fact)
    assert out.id is not None
    assert out.user_id == seed_phase1["user_id"]
    assert out.performance_cycle_id == seed_phase1["performance_cycle_id"]
    assert float(out.final_score) == 75.0

    found = await repo.get_by_user_cycle(
        seed_phase1["user_id"], seed_phase1["performance_cycle_id"]
    )
    assert found is not None
    assert found.id == out.id
    assert float(found.final_score) == 75.0


@pytest.mark.asyncio
async def test_fact_performance_summary_upsert_updates_when_existing(
    db_session, seed_phase1
) -> None:
    """upsert updates existing row for same user_id and performance_cycle_id."""
    repo = FactPerformanceSummaryRepository(db_session)
    fact1 = FactPerformanceSummary(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        role_id=seed_phase1["role_id"],
        cycle_year=2026,
        quantitative_score=Decimal("60"),
        behavioral_score=Decimal("70"),
        final_score=Decimal("65"),
        rating_band="development",
    )
    out1 = await repo.upsert(fact1)
    id_before = out1.id

    fact2 = FactPerformanceSummary(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        role_id=seed_phase1["role_id"],
        cycle_year=2026,
        quantitative_score=Decimal("85"),
        behavioral_score=Decimal("90"),
        final_score=Decimal("87.5"),
        rating_band="exceeds",
    )
    out2 = await repo.upsert(fact2)
    assert out2.id == id_before
    assert float(out2.quantitative_score) == 85.0
    assert float(out2.behavioral_score) == 90.0
    assert float(out2.final_score) == 87.5
    assert out2.rating_band == "exceeds"

    listed = await repo.list_all(cycle_year=2026)
    assert len(listed) == 1
    assert listed[0].id == id_before
    assert float(listed[0].final_score) == 87.5
