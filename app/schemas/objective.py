"""Objective request/response schemas."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class ObjectiveCreate(BaseModel):
    """Payload to create an objective."""

    user_id: str
    performance_cycle_id: str
    dimension_id: str
    template_id: str | None = None
    title: str
    description: str | None = None
    kpi_type: str | None = None
    target_value: Decimal | None = None
    unit_of_measure: str | None = None
    weight: Decimal
    start_date: date
    end_date: date


class ObjectiveUpdateStatus(BaseModel):
    """Payload to transition objective status."""

    status: str


class ObjectiveAmend(BaseModel):
    """Payload to amend an objective's target and/or weight."""

    target_value: Decimal | None = None
    weight: Decimal | None = None
    justification: str

    @field_validator("justification")
    @classmethod
    def _validate_amendment(cls, value: str, info):
        if info.data.get("target_value") is None and info.data.get("weight") is None:
            raise ValueError(
                "At least one of target_value or weight must be provided"
            )
        return value


class ObjectiveResponse(BaseModel):
    """Objective in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    dimension_id: str
    template_id: str | None
    title: str
    description: str | None
    kpi_type: str | None
    target_value: Decimal | None
    unit_of_measure: str | None
    weight: Decimal
    start_date: date
    end_date: date
    status: str
    approved_at: datetime | None
    approved_by: str | None
    locked_at: datetime | None

    model_config = {"from_attributes": True}
