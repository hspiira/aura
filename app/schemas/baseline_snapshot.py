"""Baseline snapshot request/response schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class BaselineSnapshotCreate(BaseModel):
    """Payload to create a baseline snapshot."""

    user_id: str
    performance_cycle_id: str
    template_id: str
    baseline_value: Decimal
    snapshot_date: date
    data_source: str | None = None


class BaselineSnapshotResponse(BaseModel):
    """Baseline snapshot in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    template_id: str
    baseline_value: Decimal
    snapshot_date: date
    data_source: str | None

    model_config = {"from_attributes": True}


class ValidateObjectiveRequest(BaseModel):
    """Request body for objective validation."""

    objective_id: str


class ValidateObjectiveResponse(BaseModel):
    """Response from objective validation."""

    valid: bool
    errors: list[str]
