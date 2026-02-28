"""API v1 dependency injection (composition root)."""

from collections.abc import Awaitable, Callable
from typing import Annotated, TypeVar

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
from app.infrastructure.persistence.repositories.notification_outbox_repo import (
    NotificationOutboxRepository,
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
from app.infrastructure.persistence.repositories.objective_version_repo import (
    ObjectiveVersionRepository,
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
from app.infrastructure.persistence.repositories.user_identity_repo import (
    UserIdentityRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)

_R = TypeVar("_R", bound=object)


def _repo_dep(repo_cls: type[_R]) -> Callable[..., Awaitable[_R]]:
    """Generate a FastAPI dependency that instantiates repo_cls with a DB session."""

    async def _factory(
        session: Annotated[AsyncSession, Depends(get_db_transactional)],
    ) -> _R:
        return repo_cls(session)  # type: ignore[call-arg]

    _factory.__name__ = f"get_{repo_cls.__name__.lower()}"
    return _factory


get_organization_repo = _repo_dep(OrganizationRepository)
get_department_repo = _repo_dep(DepartmentRepository)
get_role_repo = _repo_dep(RoleRepository)
get_user_repo = _repo_dep(UserRepository)
get_performance_cycle_repo = _repo_dep(PerformanceCycleRepository)
get_performance_dimension_repo = _repo_dep(PerformanceDimensionRepository)
get_role_dimension_weight_repo = _repo_dep(RoleDimensionWeightRepository)
get_objective_template_repo = _repo_dep(ObjectiveTemplateRepository)
get_objective_repo = _repo_dep(ObjectiveRepository)
get_objective_update_repo = _repo_dep(ObjectiveUpdateRepository)
get_objective_evidence_repo = _repo_dep(ObjectiveEvidenceRepository)
get_objective_score_repo = _repo_dep(ObjectiveScoreRepository)
get_audit_log_repo = _repo_dep(AuditLogRepository)
get_baseline_snapshot_repo = _repo_dep(BaselineSnapshotRepository)
get_behavioral_indicator_repo = _repo_dep(BehavioralIndicatorRepository)
get_behavioral_score_repo = _repo_dep(BehavioralScoreRepository)
get_performance_summary_repo = _repo_dep(PerformanceSummaryRepository)
get_review_session_repo = _repo_dep(ReviewSessionRepository)
get_calibration_session_repo = _repo_dep(CalibrationSessionRepository)
get_reward_policy_repo = _repo_dep(RewardPolicyRepository)
get_permission_repo = _repo_dep(PermissionRepository)
get_role_permission_repo = _repo_dep(RolePermissionRepository)
get_notification_rule_repo = _repo_dep(NotificationRuleRepository)
get_notification_log_repo = _repo_dep(NotificationLogRepository)
get_fact_performance_summary_repo = _repo_dep(FactPerformanceSummaryRepository)
get_objective_version_repo = _repo_dep(ObjectiveVersionRepository)
get_user_token_repo = _repo_dep(UserTokenRepository)
get_notification_outbox_repo = _repo_dep(NotificationOutboxRepository)
get_user_identity_repo = _repo_dep(UserIdentityRepository)


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

    return _check


def require_any_permission(*codes: str):
    """Dependency: 403 if user has none of the given permission codes."""

    async def _check(
        permissions: Annotated[set[str], Depends(get_current_user_permissions)],
    ) -> None:
        if not any(c in permissions for c in codes):
            detail = "Insufficient permission: one of " + ", ".join(codes)
            raise HTTPException(status_code=403, detail=detail)

    return _check
