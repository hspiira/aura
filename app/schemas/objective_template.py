"""Objective template request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class ObjectiveTemplateCreate(BaseModel):
    """Payload to create an objective template."""

    code: str
    title: str
    description: str | None = None
    dimension_id: str
    kpi_type: str | None = None
    default_weight: Decimal = Decimal("0")
    is_active: bool = True


class ObjectiveTemplateResponse(BaseModel):
    """Objective template in API responses."""

    id: str
    code: str
    title: str
    description: str | None
    dimension_id: str
    kpi_type: str | None
    default_weight: Decimal
    is_active: bool

    model_config = {"from_attributes": True}
