"""DB-backed tests for role-permission repository and API."""

import pytest

from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)
from app.infrastructure.persistence.repositories.role_permission_repo import (
    RolePermissionRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_role_permission_assign_and_list(db_session, seed_phase1) -> None:
    """Assign a permission to a role and list by role."""
    perm_repo = PermissionRepository(db_session)
    perm = Permission(
        code="approve_objectives",
        name="Approve objectives",
        description="Can approve objectives",
    )
    perm = await perm_repo.add(perm)

    rp_repo = RolePermissionRepository(db_session)
    rp = RolePermission(
        role_id=seed_phase1["role_id"],
        permission_id=perm.id,
    )
    rp = await rp_repo.add(rp)

    listed = await rp_repo.list_by_role(seed_phase1["role_id"])
    assert len(listed) == 1
    assert listed[0].id == rp.id
    assert listed[0].permission_id == perm.id


@pytest.mark.asyncio
async def test_role_permission_assign_idempotent(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """Assigning same role+permission via API twice returns existing (idempotent)."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    perm_repo = PermissionRepository(db_session)
    perm = Permission(
        code="run_calibration",
        name="Run calibration",
        description="Can run calibration",
    )
    perm = await perm_repo.add(perm)

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            r1 = await client.post(
                "/api/v1/role-permissions",
                json={
                    "role_id": seed_phase1["role_id"],
                    "permission_id": perm.id,
                },
            )
            r2 = await client.post(
                "/api/v1/role-permissions",
                json={
                    "role_id": seed_phase1["role_id"],
                    "permission_id": perm.id,
                },
            )
        assert r1.status_code == 201
        assert r2.status_code == 201
        assert r1.json()["id"] == r2.json()["id"]
        assert r1.json()["role_id"] == seed_phase1["role_id"]
        assert r1.json()["permission_id"] == perm.id
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)


@pytest.mark.asyncio
async def test_role_permission_remove_by_id(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """DELETE /role-permissions/{id} removes the assignment."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    perm_repo = PermissionRepository(db_session)
    perm = Permission(
        code="override_scores",
        name="Override scores",
        description="Can override scores",
    )
    perm = await perm_repo.add(perm)

    rp_repo = RolePermissionRepository(db_session)
    rp = RolePermission(
        role_id=seed_phase1["role_id"],
        permission_id=perm.id,
    )
    rp = await rp_repo.add(rp)

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.delete(
                f"/api/v1/role-permissions/{rp.id}",
            )
        assert response.status_code == 204
        found = await rp_repo.get_by_id(rp.id)
        assert found is None
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
