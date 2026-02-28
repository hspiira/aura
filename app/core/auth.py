"""Auth: resolve current user from JWT access token, legacy API key, or opaque user token."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.jwt import decode_access_token
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)
from app.shared.utils.datetime import utc_now


def _extract_bearer(request: Request) -> str | None:
    """Extract token from Authorization: Bearer header."""
    auth = request.headers.get("Authorization")
    if not auth:
        return None
    scheme, _, token = auth.partition(" ")
    if scheme.lower() == "bearer" and token:
        return token
    return None


async def get_current_user_id(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    """Return the current user id.

    Resolution order:
    1. auth_disabled → auth_default_user_id
    2. JWT access token (has 'type': 'access' claim)
    3. Legacy master API key (X-API-Key header)
    4. Opaque user token (UserToken table lookup)
    """
    settings = get_settings()
    if settings.auth_disabled:
        if not settings.auth_default_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="auth_default_user_id not configured",
            )
        return settings.auth_default_user_id

    # Try X-API-Key header first (legacy path)
    api_key = request.headers.get("X-API-Key")

    # Try Bearer token
    bearer = _extract_bearer(request)

    if not api_key and not bearer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    # Legacy master API key
    if api_key and settings.api_key and api_key == settings.api_key:
        if not settings.auth_default_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key valid but auth_default_user_id not configured",
            )
        return settings.auth_default_user_id

    token = bearer or api_key
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    # Try JWT decode first (fast, no DB hit)
    try:
        payload = decode_access_token(token)
        if payload.get("type") == "access":
            return payload["sub"]
    except jwt.PyJWTError:
        pass

    # Fallback: opaque user token (DB lookup — backward compat for API keys / M2M)
    token_repo = UserTokenRepository(session)
    user_token = await token_repo.get_by_raw_token(token)
    if user_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
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
    bearer = _extract_bearer(request)

    if not api_key and not bearer:
        return None

    # Legacy master API key
    if api_key and settings.api_key and api_key == settings.api_key:
        return settings.auth_default_user_id or None

    token = bearer or api_key
    if not token:
        return None

    # Try JWT
    try:
        payload = decode_access_token(token)
        if payload.get("type") == "access":
            return payload["sub"]
    except jwt.PyJWTError:
        pass

    # Fallback: opaque user token
    token_repo = UserTokenRepository(session)
    user_token = await token_repo.get_by_raw_token(token)
    if user_token is None or (
        user_token.expires_at is not None and utc_now() > user_token.expires_at
    ):
        return None

    return user_token.user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUserIdOptional = Annotated[str | None, Depends(get_current_user_id_optional)]
