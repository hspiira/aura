"""User endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_user_repo, require_permission
from app.domain.exceptions import ResourceNotFoundException
from app.domain.permissions import MANAGE_USERS, VIEW_USERS
from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.schemas.pagination import PageResponse
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.get("", response_model=PageResponse[UserResponse])
async def list_users(
    repo: Annotated[UserRepository, Depends(get_user_repo)],
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _perm: Annotated[None, Depends(require_permission(VIEW_USERS))] = None,
) -> PageResponse[UserResponse]:
    """List all users."""
    users, total = await repo.list_paginated(limit=limit, offset=offset)
    return PageResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_USERS))],
) -> UserResponse:
    """Create a user."""
    user = User(
        role_id=payload.role_id,
        department_id=payload.department_id,
        supervisor_id=payload.supervisor_id,
        name=payload.name,
        email=payload.email,
    )
    user = await repo.add(user)
    return UserResponse.model_validate(user)


@router.get("/{id}", response_model=UserResponse)
async def get_user(
    id: str,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
) -> UserResponse:
    """Get one user by id."""
    user = await repo.get_by_id(id)
    if user is None:
        raise ResourceNotFoundException("User", id)
    return UserResponse.model_validate(user)
