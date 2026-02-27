"""UserToken repository."""

import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user_token import UserToken


class UserTokenRepository:
    """Repository for UserToken entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def hash_token(raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get_by_raw_token(self, raw: str) -> UserToken | None:
        """Return the active token entry for a raw token, if any."""
        hashed = self.hash_token(raw)
        result = await self._session.execute(
            select(UserToken).where(
                UserToken.token_hash == hashed,
                UserToken.revoked == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def add(self, token: UserToken) -> UserToken:
        """Persist a user token."""
        self._session.add(token)
        await self._session.flush()
        await self._session.refresh(token)
        return token
