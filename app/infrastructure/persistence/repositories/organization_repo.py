"""Organization repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.organization import Organization


class OrganizationRepository:
    """Repository for Organization entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Organization]:
        """Return all organizations."""
        result = await self._session.execute(
            select(Organization).order_by(Organization.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> Organization | None:
        """Return one organization by id."""
        result = await self._session.execute(
            select(Organization).where(Organization.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, organization: Organization) -> Organization:
        """Persist an organization."""
        self._session.add(organization)
        await self._session.flush()
        await self._session.refresh(organization)
        return organization
