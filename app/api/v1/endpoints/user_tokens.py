"""User token management endpoints."""

import secrets
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
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


class UserTokenResponse(BaseModel):
    """Token record (no secret value)."""

    id: str
    user_id: str
    description: str | None
    expires_at: datetime | None
    revoked: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[UserTokenResponse])
async def list_user_tokens(
    token_repo: Annotated[UserTokenRepository, Depends(get_user_token_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_RBAC))],
    user_id: str | None = Query(None, description="Filter by user"),
    limit: int = Query(200, ge=1, le=500),
) -> list[UserTokenResponse]:
    """List token records (no secret); filter by user_id when set."""
    tokens = await token_repo.list_all(user_id=user_id, limit=limit)
    return [UserTokenResponse.model_validate(t) for t in tokens]


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


@router.post(
    "/{id}/revoke",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_user_token(
    id: str,
    token_repo: Annotated[UserTokenRepository, Depends(get_user_token_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_RBAC))],
) -> None:
    """Revoke a user token so it can no longer authenticate."""
    token = await token_repo.get_by_id(id)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )
    await token_repo.revoke(token)
