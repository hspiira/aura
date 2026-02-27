"""Behavioral indicator request/response schemas."""

from pydantic import BaseModel, Field, model_validator


class BehavioralIndicatorCreate(BaseModel):
    """Payload to create a behavioral indicator."""

    dimension_id: str
    name: str
    description: str | None = None
    rating_scale_min: int = Field(default=1, ge=1)
    rating_scale_max: int = Field(default=5, ge=1)
    is_active: bool = True

    @model_validator(mode="after")
    def _validate_scale(self) -> "BehavioralIndicatorCreate":
        if self.rating_scale_max < self.rating_scale_min:
            raise ValueError("rating_scale_max must be >= rating_scale_min")
        return self


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
