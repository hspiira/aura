"""Objective lifecycle and validation (domain)."""

from enum import Enum


class ObjectiveStatus(str, Enum):
    """Objective lifecycle states. Transitions enforced in application layer."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    REJECTED = "rejected"
    APPROVED = "approved"
    ACTIVE = "active"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    UNDER_REVIEW = "under_review"
    CLOSED = "closed"


VALID_TRANSITIONS: dict[ObjectiveStatus, set[ObjectiveStatus]] = {
    ObjectiveStatus.DRAFT: {ObjectiveStatus.SUBMITTED},
    ObjectiveStatus.SUBMITTED: {ObjectiveStatus.REJECTED, ObjectiveStatus.APPROVED},
    ObjectiveStatus.REJECTED: {ObjectiveStatus.DRAFT},
    ObjectiveStatus.APPROVED: {ObjectiveStatus.ACTIVE},
    ObjectiveStatus.ACTIVE: {ObjectiveStatus.AT_RISK, ObjectiveStatus.COMPLETED},
    ObjectiveStatus.AT_RISK: {ObjectiveStatus.ACTIVE, ObjectiveStatus.COMPLETED},
    ObjectiveStatus.COMPLETED: {ObjectiveStatus.UNDER_REVIEW},
    ObjectiveStatus.UNDER_REVIEW: {ObjectiveStatus.CLOSED},
    ObjectiveStatus.CLOSED: set(),
}


def can_transition(from_status: ObjectiveStatus, to_status: ObjectiveStatus) -> bool:
    """Return True if transition from_status -> to_status is allowed."""
    return to_status in VALID_TRANSITIONS.get(from_status, set())
