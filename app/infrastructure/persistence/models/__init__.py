"""ORM models. Import all so Alembic can see metadata."""

from app.infrastructure.persistence.models.audit_log import AuditLog
from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)
from app.infrastructure.persistence.models.behavioral_indicator import (
    BehavioralIndicator,
)
from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
from app.infrastructure.persistence.models.calibration_session import (
    CalibrationSession,
)
from app.infrastructure.persistence.models.department import Department
from app.infrastructure.persistence.models.dim_cycle import DimCycle
from app.infrastructure.persistence.models.dim_time import DimTime
from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.models.notification_log import NotificationLog
from app.infrastructure.persistence.models.notification_rule import (
    NotificationRule,
)
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_evidence import (
    ObjectiveEvidence,
)
from app.infrastructure.persistence.models.objective_flag import ObjectiveFlag
from app.infrastructure.persistence.models.objective_score import ObjectiveScore
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.models.objective_update import (
    ObjectiveUpdate,
)
from app.infrastructure.persistence.models.organization import Organization
from app.infrastructure.persistence.models.performance_cycle import (
    PerformanceCycle,
)
from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)
from app.infrastructure.persistence.models.performance_summary import (
    PerformanceSummary,
)
from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.models.review_session import ReviewSession
from app.infrastructure.persistence.models.reward_policy import RewardPolicy
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)
from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.models.user import User

__all__ = [
    "AuditLog",
    "BaselineSnapshot",
    "BehavioralIndicator",
    "BehavioralScore",
    "CalibrationSession",
    "Department",
    "DimCycle",
    "DimTime",
    "FactPerformanceSummary",
    "Objective",
    "ObjectiveEvidence",
    "ObjectiveFlag",
    "ObjectiveScore",
    "ObjectiveTemplate",
    "ObjectiveUpdate",
    "NotificationLog",
    "NotificationRule",
    "Organization",
    "Permission",
    "PerformanceCycle",
    "PerformanceDimension",
    "PerformanceSummary",
    "ReviewSession",
    "RewardPolicy",
    "Role",
    "RoleDimensionWeight",
    "RolePermission",
    "User",
]
