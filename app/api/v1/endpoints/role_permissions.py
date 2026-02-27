"""Role-permission assignment endpoints (RBAC)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.exc import IntegrityError

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_permission_repo,
    get_role_permission_repo,
    get_role_repo,
)
from app.api.v1.helpers import get_one_or_raise
from app.core.audit import audit_log
from app.core.auth import CurrentUserIdOptional
from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)
from app.infrastructure.persistence.repositories.role_permission_repo import (
    RolePermissionRepository,
)
from app.infrastructure.persistence.repositories.role_repo import RoleRepository
from app.schemas.role_permission import (
    RolePermissionCreate,
    RolePermissionResponse,
)

router = APIRouter()


@router.get("", response_model=list[RolePermissionResponse])
async def list_role_permissions(
    role_id: Annotated[str, Query(description="Filter by role")],
    repo: Annotated[RolePermissionRepository, Depends(get_role_permission_repo)],
) -> list[RolePermissionResponse]:
    """List permissions assigned to a role."""
    items = await repo.list_by_role(role_id)
    return [RolePermissionResponse.model_validate(i) for i in items]


@router.post("", response_model=RolePermissionResponse, status_code=201)
async def assign_permission_to_role(
    payload: RolePermissionCreate,
    repo: Annotated[RolePermissionRepository, Depends(get_role_permission_repo)],
    permission_repo: Annotated[PermissionRepository, Depends(get_permission_repo)],
    role_repo: Annotated[RoleRepository, Depends(get_role_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
) -> RolePermissionResponse:
    """Assign permission to role (idempotent: returns existing if already assigned)."""
    existing = await repo.get_by_role_and_permission(
        payload.role_id, payload.permission_id
    )
    if existing is not None:
        return RolePermissionResponse.model_validate(existing)
    await get_one_or_raise(
        role_repo.get_by_id(payload.role_id),
        payload.role_id,
        "Role",
    )
    await get_one_or_raise(
        permission_repo.get_by_id(payload.permission_id),
        payload.permission_id,
        "Permission",
    )
    rp = RolePermission(
        role_id=payload.role_id,
        permission_id=payload.permission_id,
    )
    try:
        rp = await repo.add(rp)
    except IntegrityError:
        existing = await repo.get_by_role_and_permission(
            payload.role_id, payload.permission_id
        )
        if existing is None:
            raise
        return RolePermissionResponse.model_validate(existing)
    await audit_log(
        audit_repo,
        "role_permission",
        rp.id,
        "assign",
        new_value={"role_id": rp.role_id, "permission_id": rp.permission_id},
        changed_by=changed_by,
    )
    return RolePermissionResponse.model_validate(rp)


@router.delete("/{id}", status_code=204)
async def remove_role_permission(
    id: str,
    repo: Annotated[RolePermissionRepository, Depends(get_role_permission_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
) -> None:
    """Remove a role-permission assignment by id."""
    rp = await get_one_or_raise(repo.get_by_id(id), id, "RolePermission")
    await audit_log(
        audit_repo,
        "role_permission",
        id,
        "remove",
        old_value={"role_id": rp.role_id, "permission_id": rp.permission_id},
        changed_by=changed_by,
    )
    await repo.delete(rp)
