"""Role dimension weight request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class RoleDimensionWeightCreate(BaseModel):
    """Payload to create a role dimension weight."""

    role_id: str
    dimension_id: str
    weight_pct: Decimal


class RoleDimensionWeightResponse(BaseModel):
    """Role dimension weight in API responses."""

    id: str
    role_id: str
    dimension_id: str
    weight_pct: Decimal

    model_config = {"from_attributes": True}
