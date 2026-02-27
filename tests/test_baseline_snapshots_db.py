"""DB-backed tests for baseline snapshot repository and API."""

from datetime import date
from decimal import Decimal

import pytest

from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_baseline_snapshot_add_and_get_by_id(db_session, seed_phase1) -> None:
    """Add a baseline snapshot and retrieve it by id."""
    template_repo = ObjectiveTemplateRepository(db_session)
    template = ObjectiveTemplate(
        code="kpi-b-id",
        title="Template for get_by_id",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    repo = BaselineSnapshotRepository(db_session)
    snapshot = BaselineSnapshot(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        template_id=template.id,
        baseline_value=Decimal("100.5"),
        snapshot_date=date(2026, 1, 15),
        data_source="manual",
    )
    snapshot = await repo.add(snapshot)

    found = await repo.get_by_id(snapshot.id)
    assert found is not None
    assert found.id == snapshot.id
    assert found.baseline_value == Decimal("100.5")
    assert found.snapshot_date == date(2026, 1, 15)
    assert found.data_source == "manual"


@pytest.mark.asyncio
async def test_baseline_snapshot_list_by_user_cycle(db_session, seed_phase1) -> None:
    """list_by_user_cycle returns only baselines for that user and cycle."""
    template_repo = ObjectiveTemplateRepository(db_session)
    template1 = ObjectiveTemplate(
        code="kpi-l1",
        title="List 1",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template1 = await template_repo.add(template1)
    template2 = ObjectiveTemplate(
        code="kpi-l2",
        title="List 2",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template2 = await template_repo.add(template2)

    repo = BaselineSnapshotRepository(db_session)
    s1 = BaselineSnapshot(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        template_id=template1.id,
        baseline_value=Decimal("10"),
        snapshot_date=date(2026, 1, 1),
    )
    s2 = BaselineSnapshot(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        template_id=template2.id,
        baseline_value=Decimal("20"),
        snapshot_date=date(2026, 1, 2),
    )
    await repo.add(s1)
    await repo.add(s2)

    listed = await repo.list_by_user_cycle(
        seed_phase1["user_id"],
        seed_phase1["performance_cycle_id"],
    )
    assert len(listed) == 2
    ids = {b.id for b in listed}
    assert s1.id in ids
    assert s2.id in ids
    assert [b.id for b in listed] == [s2.id, s1.id]


@pytest.mark.asyncio
async def test_baseline_snapshot_get_by_user_cycle_template(
    db_session, seed_phase1
) -> None:
    """get_by_user_cycle_template returns the matching baseline."""
    template_repo = ObjectiveTemplateRepository(db_session)
    template = ObjectiveTemplate(
        code="kpi-uct",
        title="User cycle template",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    repo = BaselineSnapshotRepository(db_session)
    snapshot = BaselineSnapshot(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        template_id=template.id,
        baseline_value=Decimal("99.99"),
        snapshot_date=date(2026, 2, 1),
    )
    snapshot = await repo.add(snapshot)

    found = await repo.get_by_user_cycle_template(
        seed_phase1["user_id"],
        seed_phase1["performance_cycle_id"],
        template.id,
    )
    assert found is not None
    assert found.id == snapshot.id
    assert found.baseline_value == Decimal("99.99")

    other = await repo.get_by_user_cycle_template(
        seed_phase1["user_id"],
        seed_phase1["performance_cycle_id"],
        "nonexistent-template-id",
    )
    assert other is None


@pytest.mark.asyncio
async def test_baseline_snapshot_create_via_api(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """POST /baseline-snapshots creates a snapshot and returns 201."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    template_repo = ObjectiveTemplateRepository(db_session)
    template = ObjectiveTemplate(
        code="kpi-api",
        title="API template",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/v1/baseline-snapshots",
                json={
                    "user_id": seed_phase1["user_id"],
                    "performance_cycle_id": seed_phase1["performance_cycle_id"],
                    "template_id": template.id,
                    "baseline_value": "75.25",
                    "snapshot_date": "2026-01-10",
                    "data_source": "test",
                },
            )
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == seed_phase1["user_id"]
        assert data["template_id"] == template.id
        assert data["baseline_value"] == 75.25
        assert data["snapshot_date"] == "2026-01-10"
        assert data["data_source"] == "test"
        assert "id" in data
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
