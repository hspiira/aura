"""Review session request/response schemas."""

from datetime import datetime

from pydantic import BaseModel


class ReviewSessionCreate(BaseModel):
    """Payload to create a review session."""

    user_id: str
    performance_cycle_id: str
    reviewer_id: str
    session_type: str
    status: str = "scheduled"
    scheduled_at: datetime | None = None


class ReviewSessionResponse(BaseModel):
    """Review session in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    reviewer_id: str
    session_type: str
    status: str
    scheduled_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
