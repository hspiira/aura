"""Objective update (progress) request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class ObjectiveUpdateCreate(BaseModel):
    """Payload to create an objective progress update."""

    objective_id: str
    actual_value: Decimal | None = None
    comment: str | None = None
    submitted_by: str


class ObjectiveUpdateResponse(BaseModel):
    """Objective update in API responses."""

    id: str
    objective_id: str
    actual_value: Decimal | None
    comment: str | None
    submitted_by: str

    model_config = {"from_attributes": True}
