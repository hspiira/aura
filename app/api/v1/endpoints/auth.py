"""Authentication endpoints for login, signup, logout, and SSO scaffolding."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr

from app.api.v1.dependencies import (
    get_current_user_permissions,
    get_user_identity_repo,
    get_user_repo,
    get_user_token_repo,
)
from app.application.auth_service import (
    hash_password,
    issue_user_token,
    verify_password,
)
from app.core.auth import get_current_user_id
from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.repositories.user_identity_repo import (
    UserIdentityRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)
from app.schemas.user import UserResponse

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    user: UserResponse
    permissions: list[str]


class LoginResponse(AuthUser):
    token: str


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: str | None = None
    department_id: str | None = None


class LogoutResponse(BaseModel):
    detail: str


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
    token_repo: Annotated[UserTokenRepository, Depends(get_user_token_repo)],
    permissions: Annotated[set[str], Depends(get_current_user_permissions)],
) -> LoginResponse:
    """Email/password login. Issues a new opaque bearer token."""
    user = await repo.get_by_email(str(payload.email))
    if user is None or not user.is_active or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = await issue_user_token(
        user_id=user.id,
        description="Email login",
        repo=token_repo,
    )
    return LoginResponse(
        token=token,
        user=UserResponse.model_validate(user),
        permissions=sorted(permissions),
    )


@router.post(
    "/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED
)
async def signup(
    payload: SignupRequest,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
    token_repo: Annotated[UserTokenRepository, Depends(get_user_token_repo)],
    permissions: Annotated[set[str], Depends(get_current_user_permissions)],
) -> LoginResponse:
    """Simple open sign-up: create a user record and issue a token.

    NOTE: For production, prefer an invite-based flow and enforce MANAGE_USERS.
    """
    existing = await repo.get_by_email(str(payload.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    if payload.role_id is None or payload.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role_id and department_id are required for sign-up",
        )

    user = User(
        role_id=payload.role_id,
        department_id=payload.department_id,
        supervisor_id=None,
        name=payload.name,
        email=str(payload.email),
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    user = await repo.add(user)

    token = await issue_user_token(
        user_id=user.id,
        description="Email signup",
        repo=token_repo,
    )
    return LoginResponse(
        token=token,
        user=UserResponse.model_validate(user),
        permissions=sorted(permissions),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> LogoutResponse:
    """Logout endpoint.

    Currently a no-op server-side for opaque tokens. Clients should drop the token.
    """
    _ = user_id
    auth_header = request.headers.get("Authorization") or ""
    _ = auth_header
    return LogoutResponse(detail="Logged out")


@router.get("/sso/start")
async def sso_start(provider: str) -> Response:
    """SSO start placeholder.

    Returns 501 to indicate SSO is not wired to a real IdP yet.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"SSO start for provider '{provider}' is not implemented yet",
    )


@router.get("/sso/callback")
async def sso_callback(
    provider: str,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
    identity_repo: Annotated[UserIdentityRepository, Depends(get_user_identity_repo)],
    permissions: Annotated[set[str], Depends(get_current_user_permissions)],
    code: str | None = None,
) -> LoginResponse:
    """SSO callback placeholder.

    For now, this endpoint is a stub that always returns 501.
    """
    _ = provider, code, repo, identity_repo, permissions
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="SSO callback not implemented",
    )
