"""ORM models. Import all so Alembic can see metadata."""

from app.infrastructure.persistence.models.audit_log import AuditLog
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
from app.infrastructure.persistence.models.performance_cycle import PerformanceCycle
from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)
from app.infrastructure.persistence.models.user import User

__all__ = [
    "AuditLog",
    "Department",
    "Objective",
    "ObjectiveEvidence",
    "ObjectiveScore",
    "ObjectiveTemplate",
    "ObjectiveUpdate",
    "Organization",
    "PerformanceCycle",
    "PerformanceDimension",
    "Role",
    "RoleDimensionWeight",
    "User",
]
