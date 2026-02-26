"""User endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_user_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.get("", response_model=list[UserResponse])
async def list_users(
    repo: Annotated[UserRepository, Depends(get_user_repo)],
) -> list[UserResponse]:
    """List all users."""
    users = await repo.list_all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
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
