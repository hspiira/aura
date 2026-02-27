"""User token management endpoints."""

import secrets
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.dependencies import (
    get_user_repo,
    get_user_token_repo,
    require_permission,
)
from app.domain.permissions import MANAGE_RBAC
from app.infrastructure.persistence.models.user_token import UserToken
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)

router = APIRouter()


class UserTokenCreateRequest(BaseModel):
    user_id: str
    description: str | None = None
    expires_at: datetime | None = None


class UserTokenCreateResponse(BaseModel):
    token: str


@router.post(
    "",
    response_model=UserTokenCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_token(
    payload: UserTokenCreateRequest,
    token_repo: Annotated[UserTokenRepository, Depends(get_user_token_repo)],
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_RBAC))],
) -> UserTokenCreateResponse:
    """Create a new user token and return the raw token once."""
    user = await user_repo.get_by_id(payload.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    raw_token = secrets.token_urlsafe(32)
    token_hash = UserTokenRepository.hash_token(raw_token)

    user_token = UserToken(
        user_id=payload.user_id,
        token_hash=token_hash,
        description=payload.description,
        expires_at=payload.expires_at,
        revoked=False,
    )

    await token_repo.add(user_token)

    return UserTokenCreateResponse(token=raw_token)
