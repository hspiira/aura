"""Authentication service: password hashing, verification, and user token issuance."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from argon2 import PasswordHasher

if TYPE_CHECKING:
    from app.infrastructure.persistence.repositories.user_token_repo import (
        UserTokenRepository,
    )

_ph = PasswordHasher()


def hash_password(plain: str) -> str:
    """Return Argon2 hash for a plaintext password."""
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plaintext matches the stored Argon2 hash."""
    try:
        _ph.verify(hashed, plain)
        return True
    except Exception:
        # Any error (mismatch, malformed hash, internal error) is treated as failure.
        return False


async def issue_user_token(
    user_id: str,
    description: str | None,
    *,
    expires_in: timedelta | None = None,
    repo: "UserTokenRepository",
) -> str:
    """Create a new opaque UserToken for the given user and return the raw token.

    The returned token is the value that should be sent as
    ``Authorization: Bearer <token>``.
    """
    from secrets import token_urlsafe

    from app.infrastructure.persistence.models.user_token import UserToken

    raw_token = token_urlsafe(32)
    token_hash = UserTokenRepository.hash_token(raw_token)
    expires_at: datetime | None = None
    if expires_in is not None:
        expires_at = datetime.now(timezone.utc) + expires_in

    user_token = UserToken(
        user_id=user_id,
        token_hash=token_hash,
        description=description,
        expires_at=expires_at,
        revoked=False,
    )
    await repo.add(user_token)
    return raw_token
