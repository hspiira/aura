"""Objective request/response schemas."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


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
