"""Role endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_role_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.repositories.role_repo import RoleRepository
from app.schemas.role import RoleCreate, RoleResponse

router = APIRouter()


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    repo: Annotated[RoleRepository, Depends(get_role_repo)],
) -> list[RoleResponse]:
    """List all roles."""
    roles = await repo.list_all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(
    payload: RoleCreate,
    repo: Annotated[RoleRepository, Depends(get_role_repo)],
) -> RoleResponse:
    """Create a role."""
    role = Role(
        department_id=payload.department_id,
        name=payload.name,
        level=payload.level,
        is_managerial=payload.is_managerial,
    )
    role = await repo.add(role)
    return RoleResponse.model_validate(role)


@router.get("/{id}", response_model=RoleResponse)
async def get_role(
    id: str,
    repo: Annotated[RoleRepository, Depends(get_role_repo)],
) -> RoleResponse:
    """Get one role by id."""
    role = await repo.get_by_id(id)
    if role is None:
        raise ResourceNotFoundException("Role", id)
    return RoleResponse.model_validate(role)
