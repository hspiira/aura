"""Shared persistence helpers (e.g. add + flush + refresh)."""

from typing import TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


async def persist_and_refresh(session: AsyncSession, entity: T) -> T:
    """Add entity, flush, refresh, and return it (for repo add/update)."""
    session.add(entity)
    await session.flush()
    await session.refresh(entity)
    return entity
