"""Minimal auth: current user id for RBAC and audit (API key or optional JWT)."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)
from app.shared.utils.datetime import utc_now


async def get_current_user_id(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    """Return the current user id from API key or Bearer token.

    When auth_disabled is True, returns auth_default_user_id (must be set).
    Otherwise requires X-API-Key or Authorization: Bearer <api_key> to match
    settings.api_key and returns auth_default_user_id.
    """
    settings = get_settings()
    if settings.auth_disabled:
        if not settings.auth_default_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="auth_default_user_id not configured",
            )
        return settings.auth_default_user_id

    api_key = request.headers.get("X-API-Key")
    if not api_key and request.headers.get("Authorization"):
        scheme, _, token = request.headers["Authorization"].partition(" ")
        if scheme.lower() == "bearer":
            api_key = token

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key (X-API-Key or Authorization: Bearer <key>)",
        )

    # Admin/bootstrap path: legacy API key continues to resolve to default user.
    if settings.api_key and api_key == settings.api_key:
        if not settings.auth_default_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key valid but auth_default_user_id not configured",
            )
        return settings.auth_default_user_id

    # User token path: look up opaque token in UserToken table.
    token_repo = UserTokenRepository(session)
    user_token = await token_repo.get_by_raw_token(api_key)
    if user_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked token",
        )
    if user_token.expires_at is not None and utc_now() > user_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    return user_token.user_id


async def get_current_user_id_optional(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> str | None:
    """Return current user id when auth is present; else None (for audit changed_by)."""
    settings = get_settings()
    if settings.auth_disabled:
        return settings.auth_default_user_id or None

    api_key = request.headers.get("X-API-Key")
    if not api_key and request.headers.get("Authorization"):
        scheme, _, token = request.headers["Authorization"].partition(" ")
        if scheme.lower() == "bearer":
            api_key = token

    if not api_key:
        return None

    # Admin/bootstrap path.
    if settings.api_key and api_key == settings.api_key:
        return settings.auth_default_user_id or None

    token_repo = UserTokenRepository(session)
    user_token = await token_repo.get_by_raw_token(api_key)
    if user_token is None or (
        user_token.expires_at is not None and utc_now() > user_token.expires_at
    ):
        return None

    return user_token.user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUserIdOptional = Annotated[str | None, Depends(get_current_user_id_optional)]
