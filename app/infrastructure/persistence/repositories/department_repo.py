"""Department repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.department import Department


class DepartmentRepository:
    """Repository for Department entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Department]:
        """Return all departments."""
        result = await self._session.execute(
            select(Department).order_by(Department.name)
        )
        return list(result.scalars().all())

    async def list_by_organization(self, organization_id: str) -> list[Department]:
        """Return departments for an organization."""
        result = await self._session.execute(
            select(Department)
            .where(Department.organization_id == organization_id)
            .order_by(Department.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> Department | None:
        """Return one department by id."""
        result = await self._session.execute(
            select(Department).where(Department.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, department: Department) -> Department:
        """Persist a department."""
        self._session.add(department)
        await self._session.flush()
        await self._session.refresh(department)
        return department
