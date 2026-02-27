"""DB tests for objective_versions repository and amend endpoint."""

import pytest
from httpx import AsyncClient

from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_version_repo import (
    ObjectiveVersionRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.anyio
async def test_objective_version_repository_snapshot(db_session, seed_phase1):
    """add_from_objective should create a version row with incrementing version."""
    repo = ObjectiveRepository(db_session)
    version_repo = ObjectiveVersionRepository(db_session)

    # Create a simple objective
    objective = Objective(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        dimension_id=seed_phase1["dimension_id"],
        template_id=None,
        title="Revenue growth",
        description="Grow revenue by 10%",
        kpi_type="kpi",
        target_value=None,
        unit_of_measure=None,
        weight=1,
        start_date=None,
        end_date=None,
    )
    objective = await repo.add(objective)

    versions_before = await version_repo.list_by_objective(objective.id)
    assert versions_before == []

    from app.shared.utils.datetime import utc_now

    now = utc_now()
    await version_repo.add_from_objective(
        objective=objective,
        version=1,
        justification="Initial snapshot",
        amended_by=None,
        amended_at=now,
    )

    versions_after = await version_repo.list_by_objective(objective.id)
    assert len(versions_after) == 1
    v1 = versions_after[0]
    assert v1.version == 1
    assert v1.objective_id == objective.id
    assert v1.title == objective.title


@pytest.mark.anyio
async def test_amend_objective_endpoint_creates_version(
    db_session, seed_phase1, override_db_dependency, monkeypatch
):
    """PATCH /objectives/{id}/amend should snapshot and update objective."""
    from app.api.main import app
    from app.infrastructure.persistence.database import get_db_transactional

    # Override DB dependency
    app.dependency_overrides[get_db_transactional] = override_db_dependency

    repo = ObjectiveRepository(db_session)
    objective = Objective(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        dimension_id=seed_phase1["dimension_id"],
        template_id=None,
        title="Margin",
        description=None,
        kpi_type=None,
        target_value=None,
        unit_of_measure=None,
        weight=1,
        start_date=None,
        end_date=None,
        status="approved",
    )
    objective = await repo.add(objective)

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/objectives/{objective.id}/amend",
            json={
                "target_value": 10,
                "weight": 2,
                "justification": "Increase target after calibration",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == objective.id
    assert data["target_value"] == "10"
    assert data["weight"] == 2
