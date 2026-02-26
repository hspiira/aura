"""ORM models. Import all so Alembic can see metadata."""

from app.infrastructure.persistence.models.audit_log import AuditLog
from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)
from app.infrastructure.persistence.models.behavioral_indicator import (
    BehavioralIndicator,
)
from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
from app.infrastructure.persistence.models.department import Department
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_evidence import (
    ObjectiveEvidence,
)
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
from app.infrastructure.persistence.models.review_session import ReviewSession
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)
from app.infrastructure.persistence.models.user import User

__all__ = [
    "AuditLog",
    "BaselineSnapshot",
    "BehavioralIndicator",
    "BehavioralScore",
    "Department",
    "Objective",
    "ObjectiveEvidence",
    "ObjectiveScore",
    "ObjectiveTemplate",
    "ObjectiveUpdate",
    "Organization",
    "PerformanceCycle",
    "PerformanceDimension",
    "PerformanceSummary",
    "ReviewSession",
    "Role",
    "RoleDimensionWeight",
    "User",
]
