"""DB-backed tests for calibration session repository and API."""

from datetime import datetime, timezone

import pytest

from app.infrastructure.persistence.models.calibration_session import (
    CalibrationSession,
)
from app.infrastructure.persistence.repositories.calibration_session_repo import (
    CalibrationSessionRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_calibration_session_add_and_get_by_id(db_session, seed_phase1) -> None:
    """Add a calibration session and retrieve it by id."""
    repo = CalibrationSessionRepository(db_session)
    session = CalibrationSession(
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        conducted_by_id=seed_phase1["user_id"],
        conducted_at=datetime(2026, 3, 15, 14, 0, 0, tzinfo=timezone.utc),
        notes="Q1 calibration completed",
    )
    session = await repo.add(session)

    found = await repo.get_by_id(session.id)
    assert found is not None
    assert found.id == session.id
    assert found.performance_cycle_id == seed_phase1["performance_cycle_id"]
    assert found.department_id == seed_phase1["department_id"]
    assert found.conducted_by_id == seed_phase1["user_id"]
    assert found.notes == "Q1 calibration completed"


@pytest.mark.asyncio
async def test_calibration_session_list_by_cycle(db_session, seed_phase1) -> None:
    """list_by_cycle returns only sessions for that performance cycle."""
    repo = CalibrationSessionRepository(db_session)
    s1 = CalibrationSession(
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        conducted_by_id=seed_phase1["user_id"],
        conducted_at=datetime(2026, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
        notes="First",
    )
    s2 = CalibrationSession(
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        conducted_by_id=seed_phase1["user_id"],
        conducted_at=datetime(2026, 3, 10, 10, 0, 0, tzinfo=timezone.utc),
        notes="Second",
    )
    await repo.add(s1)
    await repo.add(s2)

    listed = await repo.list_by_cycle(seed_phase1["performance_cycle_id"])
    assert len(listed) == 2
    ids = {s.id for s in listed}
    assert s1.id in ids
    assert s2.id in ids


@pytest.mark.asyncio
async def test_calibration_session_list_by_department(db_session, seed_phase1) -> None:
    """list_by_department returns only sessions for that department."""
    repo = CalibrationSessionRepository(db_session)
    session = CalibrationSession(
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        department_id=seed_phase1["department_id"],
        conducted_by_id=seed_phase1["user_id"],
        conducted_at=datetime(2026, 4, 1, 9, 0, 0, tzinfo=timezone.utc),
    )
    session = await repo.add(session)

    listed = await repo.list_by_department(seed_phase1["department_id"])
    assert len(listed) >= 1
    assert any(s.id == session.id for s in listed)


@pytest.mark.asyncio
async def test_calibration_session_create_via_api(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """POST /calibration-sessions creates a session and returns 201."""
    _ = db_session
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/v1/calibration-sessions",
                json={
                    "performance_cycle_id": seed_phase1["performance_cycle_id"],
                    "department_id": seed_phase1["department_id"],
                    "conducted_by_id": seed_phase1["user_id"],
                    "conducted_at": "2026-05-15T14:00:00Z",
                    "notes": "API-created calibration",
                },
            )
        assert response.status_code == 201
        data = response.json()
        assert data["performance_cycle_id"] == seed_phase1["performance_cycle_id"]
        assert data["department_id"] == seed_phase1["department_id"]
        assert data["conducted_by_id"] == seed_phase1["user_id"]
        assert data["notes"] == "API-created calibration"
        assert "id" in data
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
