"""Review session lifecycle and type (domain)."""

from enum import Enum


class ReviewSessionStatus(str, Enum):
    """Review session lifecycle states."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReviewSessionType(str, Enum):
    """Review session type variants."""

    MID_YEAR = "mid_year"
    FINAL = "final"
