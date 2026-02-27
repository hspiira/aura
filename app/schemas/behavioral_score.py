"""Behavioral score request/response schemas."""

from pydantic import BaseModel, Field


class BehavioralScoreCreate(BaseModel):
    """Payload to create a behavioral score."""

    user_id: str
    performance_cycle_id: str
    indicator_id: str
    rating: int = Field(
        ge=1,
        description="Rating within the indicator's scale (validated in handler).",
    )
    manager_comment: str | None = Field(default=None, max_length=2000)


class BehavioralScoreResponse(BaseModel):
    """Behavioral score in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    indicator_id: str
    rating: int
    manager_comment: str | None

    model_config = {"from_attributes": True}
