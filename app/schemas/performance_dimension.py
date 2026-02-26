"""Performance dimension request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class PerformanceDimensionCreate(BaseModel):
    """Payload to create a performance dimension."""

    name: str
    is_quantitative: bool = True
    default_weight_pct: Decimal = Decimal("0")


class PerformanceDimensionResponse(BaseModel):
    """Performance dimension in API responses."""

    id: str
    name: str
    is_quantitative: bool
    default_weight_pct: Decimal

    model_config = {"from_attributes": True}
