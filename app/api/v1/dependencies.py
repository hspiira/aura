"""API v1 dependency injection (composition root)."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.database import get_db_transactional
from app.infrastructure.persistence.repositories.department_repo import (
    DepartmentRepository,
)
from app.infrastructure.persistence.repositories.organization_repo import (
    OrganizationRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.infrastructure.persistence.repositories.performance_dimension_repo import (
    PerformanceDimensionRepository,
)
from app.infrastructure.persistence.repositories.role_dimension_weight_repo import (
    RoleDimensionWeightRepository,
)
from app.infrastructure.persistence.repositories.role_repo import RoleRepository
from app.infrastructure.persistence.repositories.user_repo import UserRepository


async def get_organization_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> OrganizationRepository:
    """Yield organization repository."""
    return OrganizationRepository(session)


async def get_department_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> DepartmentRepository:
    """Yield department repository."""
    return DepartmentRepository(session)


async def get_role_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> RoleRepository:
    """Yield role repository."""
    return RoleRepository(session)


async def get_user_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> UserRepository:
    """Yield user repository."""
    return UserRepository(session)


async def get_performance_cycle_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> PerformanceCycleRepository:
    """Yield performance cycle repository."""
    return PerformanceCycleRepository(session)


async def get_performance_dimension_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> PerformanceDimensionRepository:
    """Yield performance dimension repository."""
    return PerformanceDimensionRepository(session)


async def get_role_dimension_weight_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> RoleDimensionWeightRepository:
    """Yield role dimension weight repository."""
    return RoleDimensionWeightRepository(session)
