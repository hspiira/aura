"""Async SQLAlchemy engine, session factory, and Base.

Uses lazy engine creation so app can start without DATABASE_URL.
Raises SqlNotConfiguredException when DB is required but not configured.
"""

from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.domain.exceptions import SqlNotConfiguredException


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""


engine: Any = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None


def _ensure_engine() -> None:
    """Create engine and AsyncSessionLocal on first use."""
    global engine, AsyncSessionLocal
    if AsyncSessionLocal is not None:
        return
    settings = get_settings()
    database_url = settings.database_url
    if not database_url:
        raise SqlNotConfiguredException()
    engine = create_async_engine(
        database_url,
        echo=settings.database_echo,
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


async def get_db() -> AsyncIterator[AsyncSession]:
    """Yield a database session for read operations."""
    _ensure_engine()
    if AsyncSessionLocal is None:
        raise SqlNotConfiguredException()
    async with AsyncSessionLocal() as session:
        yield session


async def get_db_transactional() -> AsyncIterator[AsyncSession]:
    """Yield a database session with an open transaction for writes."""
    _ensure_engine()
    if AsyncSessionLocal is None:
        raise SqlNotConfiguredException()
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session
