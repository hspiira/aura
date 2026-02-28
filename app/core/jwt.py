"""JWT access-token creation and verification."""

from datetime import timedelta

import jwt

from app.core.config import get_settings
from app.shared.utils.datetime import utc_now


def create_access_token(
    user_id: str,
    role_id: str,
    permissions: list[str],
) -> str:
    """Create a short-lived JWT access token embedding user claims."""
    settings = get_settings()
    now = utc_now()
    payload = {
        "sub": user_id,
        "role": role_id,
        "perms": permissions,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token. Raises jwt.PyJWTError on failure."""
    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
