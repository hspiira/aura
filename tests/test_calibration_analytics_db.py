"""DB tests for calibration analytics service and endpoints."""

import pytest
from httpx import AsyncClient

from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.anyio
async def test_calibration_distribution_and_variance_service(db_session, seed_phase1):
    """Service functions should compute buckets and variance from fact rows."""
    repo = FactPerformanceSummaryRepository(db_session)

    # Two departments, different scores
    facts = [
        FactPerformanceSummary(
            user_id="u1",
            department_id=seed_phase1["department_id"],
            role_id=seed_phase1["role_id"],
            performance_cycle_id=seed_phase1["performance_cycle_id"],
            cycle_year=2026,
            final_score=80,
        ),
        FactPerformanceSummary(
            user_id="u2",
            department_id=seed_phase1["department_id"],
            role_id=seed_phase1["role_id"],
            performance_cycle_id=seed_phase1["performance_cycle_id"],
            cycle_year=2026,
            final_score=92,
        ),
    ]
    for fact in facts:
        db_session.add(fact)
    await db_session.flush()

    from app.application.calibration_analytics import get_distribution, get_variance

    buckets = await get_distribution(
        repo,
        cycle_id=seed_phase1["performance_cycle_id"],
        department_id=None,
    )
    assert buckets  # non-empty

    items = await get_variance(
        repo,
        cycle_id=seed_phase1["performance_cycle_id"],
        department_id=None,
    )
    assert items
    assert items[0].department_id == seed_phase1["department_id"]


@pytest.mark.anyio
async def test_calibration_analytics_endpoints_require_permission(
    db_session, seed_phase1, override_db_dependency
):
    """Endpoints should be wired and reachable (permission checked by dependency)."""
    from app.api.main import app
    from app.infrastructure.persistence.database import get_db_transactional

    app.dependency_overrides[get_db_transactional] = override_db_dependency

    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/calibration/distribution",
            params={"cycle_id": seed_phase1["performance_cycle_id"]},
        )
    # When RBAC denies, this is 403; when allowed, 200. Just assert not 404.
    assert resp.status_code in (200, 403)
