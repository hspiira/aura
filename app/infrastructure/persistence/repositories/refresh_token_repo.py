"""RefreshToken repository."""

import hashlib

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    """Repository for RefreshToken entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def hash_token(raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get_by_raw_token(self, raw: str) -> RefreshToken | None:
        """Return the active refresh token for a raw value, if any."""
        hashed = self.hash_token(raw)
        result = await self._session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == hashed,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def add(self, token: RefreshToken) -> RefreshToken:
        """Persist a refresh token."""
        self._session.add(token)
        await self._session.flush()
        await self._session.refresh(token)
        return token

    async def revoke(self, token: RefreshToken) -> None:
        """Mark a refresh token as revoked."""
        token.revoked = True
        await self._session.flush()

    async def revoke_all_for_user(self, user_id: str) -> None:
        """Revoke all refresh tokens for a user (e.g. on password change or logout-all)."""
        await self._session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,  # noqa: E712
            )
            .values(revoked=True)
        )
        await self._session.flush()
