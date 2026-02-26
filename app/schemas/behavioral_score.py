"""Behavioral score request/response schemas."""

from pydantic import BaseModel


class BehavioralScoreCreate(BaseModel):
    """Payload to create a behavioral score."""

    user_id: str
    performance_cycle_id: str
    indicator_id: str
    rating: int
    manager_comment: str | None = None


class BehavioralScoreResponse(BaseModel):
    """Behavioral score in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    indicator_id: str
    rating: int
    manager_comment: str | None

    model_config = {"from_attributes": True}
