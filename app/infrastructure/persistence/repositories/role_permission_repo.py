"""RolePermission repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.persist import persist_and_refresh


class RolePermissionRepository:
    """Repository for RolePermission (role-permission association)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_role(self, role_id: str) -> list[RolePermission]:
        """Return all role-permission links for a role."""
        result = await self._session.execute(
            select(RolePermission).where(RolePermission.role_id == role_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> RolePermission | None:
        """Return one role-permission link by id."""
        result = await self._session.execute(
            select(RolePermission).where(RolePermission.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_role_and_permission(
        self, role_id: str, permission_id: str
    ) -> RolePermission | None:
        """Return the link if it exists."""
        result = await self._session.execute(
            select(RolePermission).where(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, role_permission: RolePermission) -> RolePermission:
        """Persist a role-permission link."""
        return await persist_and_refresh(self._session, role_permission)

    async def delete(self, role_permission: RolePermission) -> None:
        """Remove a role-permission link."""
        await self._session.delete(role_permission)
        await self._session.flush()
