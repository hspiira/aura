"""Permission repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.persist import persist_and_refresh


class PermissionRepository:
    """Repository for Permission entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Permission]:
        """Return all permissions."""
        result = await self._session.execute(
            select(Permission).order_by(Permission.code)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> Permission | None:
        """Return one permission by id."""
        result = await self._session.execute(
            select(Permission).where(Permission.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Permission | None:
        """Return one permission by code."""
        result = await self._session.execute(
            select(Permission).where(Permission.code == code)
        )
        return result.scalar_one_or_none()

    async def add(self, permission: Permission) -> Permission:
        """Persist a permission."""
        return await persist_and_refresh(self._session, permission)
