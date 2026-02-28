"""UserIdentity repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user_identity import UserIdentity


class UserIdentityRepository:
    """Repository for UserIdentity entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_provider_subject(
        self,
        provider: str,
        subject: str,
    ) -> UserIdentity | None:
        """Return identity by provider + subject."""
        result = await self._session.execute(
            select(UserIdentity).where(
                UserIdentity.provider == provider,
                UserIdentity.subject == subject,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, identity: UserIdentity) -> UserIdentity:
        """Persist an identity."""
        self._session.add(identity)
        await self._session.flush()
        await self._session.refresh(identity)
        return identity
