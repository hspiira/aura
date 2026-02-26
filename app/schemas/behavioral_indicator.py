"""Behavioral indicator request/response schemas."""

from pydantic import BaseModel


class BehavioralIndicatorCreate(BaseModel):
    """Payload to create a behavioral indicator."""

    dimension_id: str
    name: str
    description: str | None = None
    rating_scale_min: int = 1
    rating_scale_max: int = 5
    is_active: bool = True


class BehavioralIndicatorResponse(BaseModel):
    """Behavioral indicator in API responses."""

    id: str
    dimension_id: str
    name: str
    description: str | None
    rating_scale_min: int
    rating_scale_max: int
    is_active: bool

    model_config = {"from_attributes": True}
