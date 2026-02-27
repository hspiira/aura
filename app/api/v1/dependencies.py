"""API v1 dependency injection (composition root)."""

from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id

from app.infrastructure.persistence.database import get_db_transactional
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.infrastructure.persistence.repositories.behavioral_indicator_repo import (
    BehavioralIndicatorRepository,
)
from app.infrastructure.persistence.repositories.behavioral_score_repo import (
    BehavioralScoreRepository,
)
from app.infrastructure.persistence.repositories.calibration_session_repo import (
    CalibrationSessionRepository,
)
from app.infrastructure.persistence.repositories.department_repo import (
    DepartmentRepository,
)
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)
from app.infrastructure.persistence.repositories.notification_log_repo import (
    NotificationLogRepository,
)
from app.infrastructure.persistence.repositories.notification_rule_repo import (
    NotificationRuleRepository,
)
from app.infrastructure.persistence.repositories.objective_evidence_repo import (
    ObjectiveEvidenceRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.infrastructure.persistence.repositories.objective_update_repo import (
    ObjectiveUpdateRepository,
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
from app.infrastructure.persistence.repositories.performance_summary_repo import (
    PerformanceSummaryRepository,
)
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)
from app.infrastructure.persistence.repositories.review_session_repo import (
    ReviewSessionRepository,
)
from app.infrastructure.persistence.repositories.reward_policy_repo import (
    RewardPolicyRepository,
)
from app.infrastructure.persistence.repositories.role_dimension_weight_repo import (
    RoleDimensionWeightRepository,
)
from app.infrastructure.persistence.repositories.role_permission_repo import (
    RolePermissionRepository,
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


async def get_objective_template_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ObjectiveTemplateRepository:
    """Yield objective template repository."""
    return ObjectiveTemplateRepository(session)


async def get_objective_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ObjectiveRepository:
    """Yield objective repository."""
    return ObjectiveRepository(session)


async def get_objective_update_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ObjectiveUpdateRepository:
    """Yield objective update repository."""
    return ObjectiveUpdateRepository(session)


async def get_objective_evidence_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ObjectiveEvidenceRepository:
    """Yield objective evidence repository."""
    return ObjectiveEvidenceRepository(session)


async def get_objective_score_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ObjectiveScoreRepository:
    """Yield objective score repository."""
    return ObjectiveScoreRepository(session)


async def get_audit_log_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> AuditLogRepository:
    """Yield audit log repository."""
    return AuditLogRepository(session)


async def get_baseline_snapshot_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> BaselineSnapshotRepository:
    """Yield baseline snapshot repository."""
    return BaselineSnapshotRepository(session)


async def get_behavioral_indicator_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> BehavioralIndicatorRepository:
    """Yield behavioral indicator repository."""
    return BehavioralIndicatorRepository(session)


async def get_behavioral_score_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> BehavioralScoreRepository:
    """Yield behavioral score repository."""
    return BehavioralScoreRepository(session)


async def get_performance_summary_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> PerformanceSummaryRepository:
    """Yield performance summary repository."""
    return PerformanceSummaryRepository(session)


async def get_review_session_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> ReviewSessionRepository:
    """Yield review session repository."""
    return ReviewSessionRepository(session)


async def get_calibration_session_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> CalibrationSessionRepository:
    """Yield calibration session repository."""
    return CalibrationSessionRepository(session)


async def get_reward_policy_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> RewardPolicyRepository:
    """Yield reward policy repository."""
    return RewardPolicyRepository(session)


async def get_permission_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> PermissionRepository:
    """Yield permission repository."""
    return PermissionRepository(session)


async def get_role_permission_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> RolePermissionRepository:
    """Yield role-permission repository."""
    return RolePermissionRepository(session)


async def get_notification_rule_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> NotificationRuleRepository:
    """Yield notification rule repository."""
    return NotificationRuleRepository(session)


async def get_notification_log_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> NotificationLogRepository:
    """Yield notification log repository."""
    return NotificationLogRepository(session)


async def get_fact_performance_summary_repo(
    session: Annotated[AsyncSession, Depends(get_db_transactional)],
) -> FactPerformanceSummaryRepository:
    """Yield analytics fact repository."""
    return FactPerformanceSummaryRepository(session)


async def get_current_user_permissions(
    user_id: Annotated[str, Depends(get_current_user_id)],
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    role_permission_repo: Annotated[
        RolePermissionRepository, Depends(get_role_permission_repo)
    ],
) -> set[str]:
    """Resolve current user -> role -> permission codes (for RBAC)."""
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=403, detail="User or role not found")
    codes = await role_permission_repo.list_permission_codes_by_role(user.role_id)
    return set(codes)


def require_permission(code: str):
    """Return a dependency that raises 403 if current user lacks the permission."""

    async def _check(
        permissions: Annotated[set[str], Depends(get_current_user_permissions)],
    ) -> None:
        if code not in permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permission: {code} required",
            )

    return Depends(_check)
