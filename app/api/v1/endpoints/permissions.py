"""Permission endpoints (RBAC)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import get_permission_repo
from app.api.v1.helpers import get_one_or_raise
from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)
from app.schemas.permission import PermissionCreate, PermissionResponse

router = APIRouter()


@router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    repo: Annotated[PermissionRepository, Depends(get_permission_repo)],
) -> list[PermissionResponse]:
    """List all permissions."""
    items = await repo.list_all()
    return [PermissionResponse.model_validate(i) for i in items]


@router.post("", response_model=PermissionResponse, status_code=201)
async def create_permission(
    payload: PermissionCreate,
    repo: Annotated[PermissionRepository, Depends(get_permission_repo)],
) -> PermissionResponse:
    """Create a permission."""
    existing = await repo.get_by_code(payload.code)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Permission with code '{payload.code}' already exists.",
        )

    permission = Permission(
        code=payload.code,
        name=payload.name,
        description=payload.description,
    )
    permission = await repo.add(permission)
    return PermissionResponse.model_validate(permission)


@router.get("/{id}", response_model=PermissionResponse)
async def get_permission(
    id: str,
    repo: Annotated[PermissionRepository, Depends(get_permission_repo)],
) -> PermissionResponse:
    """Get one permission by id."""
    permission = await get_one_or_raise(repo.get_by_id(id), id, "Permission")
    return PermissionResponse.model_validate(permission)
