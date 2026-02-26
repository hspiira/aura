"""Objective score response schema (read-only)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ObjectiveScoreResponse(BaseModel):
    """Objective score in API responses."""

    id: str
    objective_id: str
    achievement_percentage: Decimal
    weighted_score: Decimal
    calculated_at: datetime
    locked: bool

    model_config = {"from_attributes": True}
