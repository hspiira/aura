"""DB-backed tests for permission repository and API."""

import pytest

from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_permission_add_and_get_by_id(db_session) -> None:
    """Add a permission and retrieve it by id."""
    repo = PermissionRepository(db_session)
    perm = Permission(
        code="approve_objectives",
        name="Approve objectives",
        description="Can approve objectives for direct reports",
    )
    perm = await repo.add(perm)

    found = await repo.get_by_id(perm.id)
    assert found is not None
    assert found.id == perm.id
    assert found.code == "approve_objectives"
    assert found.name == "Approve objectives"


@pytest.mark.asyncio
async def test_permission_get_by_code(db_session) -> None:
    """get_by_code returns the permission with that code."""
    repo = PermissionRepository(db_session)
    perm = Permission(
        code="run_calibration",
        name="Run calibration",
        description="Can run calibration sessions",
    )
    perm = await repo.add(perm)

    found = await repo.get_by_code("run_calibration")
    assert found is not None
    assert found.id == perm.id
    assert found.code == "run_calibration"


@pytest.mark.asyncio
async def test_permission_list_all(db_session) -> None:
    """list_all returns permissions ordered by code."""
    repo = PermissionRepository(db_session)
    p1 = Permission(
        code="view_audit_logs",
        name="View audit logs",
        description="View audit log entries",
    )
    p2 = Permission(
        code="approve_objectives",
        name="Approve objectives",
        description="Approve objectives",
    )
    await repo.add(p1)
    await repo.add(p2)

    listed = await repo.list_all()
    assert len(listed) == 2
    assert listed[0].code <= listed[1].code
    assert listed[0].code == "approve_objectives"


@pytest.mark.asyncio
async def test_permission_create_via_api(db_session, override_db_dependency) -> None:
    """POST /permissions creates a permission and returns 201."""
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
                "/api/v1/permissions",
                json={
                    "code": "manage_templates",
                    "name": "Manage templates",
                    "description": "Can manage objective templates",
                },
            )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "manage_templates"
        assert data["name"] == "Manage templates"
        assert "id" in data
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
