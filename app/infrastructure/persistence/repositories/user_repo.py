"""User repository."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user import User


class UserRepository:
    """Repository for User entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[User]:
        """Return all users."""
        result = await self._session.execute(select(User).order_by(User.name))
        return list(result.scalars().all())

    async def list_paginated(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[User], int]:
        """Return page of users and total count."""
        count_result = await self._session.execute(
            select(func.count()).select_from(User)
        )
        total = count_result.scalar_one()
        result = await self._session.execute(
            select(User).order_by(User.name).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def list_by_department(self, department_id: str) -> list[User]:
        """Return users in a department."""
        result = await self._session.execute(
            select(User).where(User.department_id == department_id).order_by(User.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> User | None:
        """Return one user by id."""
        result = await self._session.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Return one user by email."""
        result = await self._session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def add(self, user: User) -> User:
        """Persist a user."""
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    _update_fields = frozenset(
        {"role_id", "department_id", "supervisor_id", "name", "email"}
    )

    async def update(self, user_id: str, **fields: str | None) -> User | None:
        """Update a user by id. Only allowed keys in fields are applied.
        supervisor_id and email may be set to None. Returns updated user or None."""
        user = await self.get_by_id(user_id)
        if user is None:
            return None
        for key, value in fields.items():
            if key in self._update_fields and hasattr(user, key):
                setattr(user, key, value)
        await self._session.flush()
        await self._session.refresh(user)
        return user
