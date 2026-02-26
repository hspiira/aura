"""Pytest configuration and shared fixtures."""

import os
from collections.abc import AsyncIterator, Callable

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

# Mark all tests in test_*_db.py as requires_db when we add the marker to the module
# (handled per-test or per-module in the test files)


@pytest.fixture
def anyio_backend() -> str:
    """Use asyncio backend for pytest-asyncio."""
    return "asyncio"


def _get_database_url() -> str:
    """Return DATABASE_URL from environment only (avoids loading full Settings)."""
    return os.environ.get("DATABASE_URL", "").strip()


@pytest.fixture
def database_url() -> str:
    """Require DATABASE_URL; skip test when unset (for requires_db tests)."""
    url = _get_database_url()
    if not url:
        pytest.skip("DATABASE_URL not set; skip DB-backed tests")
    return url


@pytest.fixture
async def db_session(database_url: str):
    """Yield an async DB session with a transaction that is rolled back after the test.

    Ensures engine is created, then opens a new session, begins a transaction,
    yields the session, and rolls back so no data persists.
    """
    _ = database_url  # consumed for fixture ordering; skip when unset
    from app.infrastructure.persistence.database import (
        AsyncSessionLocal,
        _ensure_engine,
    )

    _ensure_engine()
    if AsyncSessionLocal is None:
        pytest.skip("Database not configured")
    session = AsyncSessionLocal()
    await session.begin()
    try:
        yield session
    finally:
        await session.rollback()
        await session.close()


@pytest.fixture
def override_db_dependency(
    db_session: AsyncSession,
) -> Callable[[], AsyncIterator[AsyncSession]]:
    """Factory for overriding get_db_transactional in API tests."""
    async def override_get_db() -> AsyncIterator[AsyncSession]:
        yield db_session

    return override_get_db


@pytest.fixture
async def seed_phase1(db_session):
    """Create minimal Phase 1 entities: org, dept, role, user, cycle, dimension.

    Yields a dict with: organization_id, department_id, role_id, user_id,
    performance_cycle_id, dimension_id. All IDs are CUIDs from the created rows.
    """
    from datetime import date
    from decimal import Decimal

    from app.infrastructure.persistence.models.department import Department
    from app.infrastructure.persistence.models.organization import Organization
    from app.infrastructure.persistence.models.performance_cycle import (
        PerformanceCycle,
    )
    from app.infrastructure.persistence.models.performance_dimension import (
        PerformanceDimension,
    )
    from app.infrastructure.persistence.models.role import Role
    from app.infrastructure.persistence.models.user import User

    org = Organization(name="Test Org")
    db_session.add(org)
    await db_session.flush()

    dept = Department(organization_id=org.id, name="Test Dept")
    db_session.add(dept)
    await db_session.flush()

    role = Role(department_id=dept.id, name="Test Role")
    db_session.add(role)
    await db_session.flush()

    user = User(
        role_id=role.id,
        department_id=dept.id,
        name="Test User",
        email="test@example.com",
    )
    db_session.add(user)
    await db_session.flush()

    cycle = PerformanceCycle(
        name="FY26",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        status="active",
    )
    db_session.add(cycle)
    await db_session.flush()

    dimension = PerformanceDimension(
        name="Financial",
        is_quantitative=True,
        default_weight_pct=Decimal("100"),
    )
    db_session.add(dimension)
    await db_session.flush()

    yield {
        "organization_id": org.id,
        "department_id": dept.id,
        "role_id": role.id,
        "user_id": user.id,
        "performance_cycle_id": cycle.id,
        "dimension_id": dimension.id,
    }
