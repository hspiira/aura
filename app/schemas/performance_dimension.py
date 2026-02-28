"""Performance dimension request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class PerformanceDimensionCreate(BaseModel):
    """Payload to create a performance dimension."""

    name: str
    is_quantitative: bool = True
    default_weight_pct: Decimal = Decimal("0")


class PerformanceDimensionUpdate(BaseModel):
    """Payload to update a performance dimension (partial)."""

    name: str | None = None
    is_quantitative: bool | None = None
    default_weight_pct: Decimal | None = None


class PerformanceDimensionResponse(BaseModel):
    """Performance dimension in API responses."""

    id: str
    name: str
    is_quantitative: bool
    default_weight_pct: Decimal

    model_config = {"from_attributes": True}
