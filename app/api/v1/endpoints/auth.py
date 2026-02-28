"""Authentication endpoints: login, refresh, logout."""

import secrets
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.core.config import get_settings
from app.core.jwt import create_access_token
from app.core.password import verify_password
from app.infrastructure.persistence.database import get_db_transactional
from app.infrastructure.persistence.models.refresh_token import RefreshToken
from app.infrastructure.persistence.repositories.refresh_token_repo import (
    RefreshTokenRepository,
)
from app.infrastructure.persistence.repositories.role_permission_repo import (
    RolePermissionRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.shared.utils.datetime import utc_now

router = APIRouter()

# ─── Schemas ────────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ─── Helpers ────────────────────────────────────────────────────────────────


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Set httpOnly refresh token cookie."""
    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=raw_token,
        httponly=True,
        secure=settings.env != "development",
        samesite="strict",
        max_age=settings.jwt_refresh_token_expire_days * 86400,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="strict",
        path="/api/v1/auth",
    )


async def _create_tokens(
    user_id: str,
    role_id: str,
    session: AsyncSession,
    response: Response,
) -> TokenResponse:
    """Create JWT access token and refresh token cookie for a user."""
    settings = get_settings()

    # Resolve permissions for JWT claims
    perm_repo = RolePermissionRepository(session)
    permission_codes = await perm_repo.list_permission_codes_by_role(role_id)

    access_token = create_access_token(
        user_id=user_id,
        role_id=role_id,
        permissions=list(permission_codes),
    )

    # Create refresh token
    raw_refresh = secrets.token_urlsafe(32)
    token_hash = RefreshTokenRepository.hash_token(raw_refresh)
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=utc_now() + timedelta(days=settings.jwt_refresh_token_expire_days),
        revoked=False,
    )
    refresh_repo = RefreshTokenRepository(session)
    await refresh_repo.add(refresh_token)

    _set_refresh_cookie(response, raw_refresh)

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


# ─── Endpoints ──────────────────────────────────────────────────────────────


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> TokenResponse:
    """Authenticate with email + password. Returns JWT access token and sets refresh cookie."""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(payload.email)

    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return await _create_tokens(user.id, user.role_id, session, response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token + rotated refresh token."""
    raw_refresh = request.cookies.get("refresh_token")
    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    refresh_repo = RefreshTokenRepository(session)
    token_record = await refresh_repo.get_by_raw_token(raw_refresh)

    if token_record is None:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if utc_now() > token_record.expires_at:
        await refresh_repo.revoke(token_record)
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Rotate: revoke old, issue new
    await refresh_repo.revoke(token_record)

    # Look up user to get role_id
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(token_record.user_id)
    if user is None:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return await _create_tokens(user.id, user.role_id, session, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> None:
    """Revoke the current refresh token and clear the cookie."""
    raw_refresh = request.cookies.get("refresh_token")
    if raw_refresh:
        refresh_repo = RefreshTokenRepository(session)
        token_record = await refresh_repo.get_by_raw_token(raw_refresh)
        if token_record:
            await refresh_repo.revoke(token_record)

    _clear_refresh_cookie(response)
