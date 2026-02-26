"""Role repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.role import Role


class RoleRepository:
    """Repository for Role entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Role]:
        """Return all roles."""
        result = await self._session.execute(select(Role).order_by(Role.name))
        return list(result.scalars().all())

    async def list_by_department(self, department_id: str) -> list[Role]:
        """Return roles for a department."""
        result = await self._session.execute(
            select(Role).where(Role.department_id == department_id).order_by(Role.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> Role | None:
        """Return one role by id."""
        result = await self._session.execute(select(Role).where(Role.id == id))
        return result.scalar_one_or_none()

    async def add(self, role: Role) -> Role:
        """Persist a role."""
        self._session.add(role)
        await self._session.flush()
        await self._session.refresh(role)
        return role
