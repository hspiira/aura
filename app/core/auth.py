"""Minimal auth: current user id for RBAC and audit (API key or optional JWT)."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.config import get_settings


async def get_current_user_id(request: Request) -> str:
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

    if not settings.api_key or api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    if not settings.auth_default_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key valid but auth_default_user_id not configured",
        )

    return settings.auth_default_user_id


async def get_current_user_id_optional(request: Request) -> str | None:
    """Return current user id when auth is present; else None (for audit changed_by)."""
    settings = get_settings()
    if settings.auth_disabled:
        return settings.auth_default_user_id or None

    api_key = request.headers.get("X-API-Key")
    if not api_key and request.headers.get("Authorization"):
        scheme, _, token = request.headers["Authorization"].partition(" ")
        if scheme.lower() == "bearer":
            api_key = token

    if not api_key or not settings.api_key or api_key != settings.api_key:
        return None

    return settings.auth_default_user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUserIdOptional = Annotated[str | None, Depends(get_current_user_id_optional)]
