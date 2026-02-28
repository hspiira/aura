"""Review session request/response schemas."""

from datetime import datetime

from pydantic import BaseModel

from app.domain.review_session import ReviewSessionStatus, ReviewSessionType


class ReviewSessionCreate(BaseModel):
    """Payload to create a review session."""

    user_id: str
    performance_cycle_id: str
    reviewer_id: str
    session_type: ReviewSessionType
    status: ReviewSessionStatus = ReviewSessionStatus.SCHEDULED
    scheduled_at: datetime | None = None


class ReviewSessionUpdate(BaseModel):
    """Payload to update a review session (e.g. status transition)."""

    status: ReviewSessionStatus


class ReviewSessionResponse(BaseModel):
    """Review session in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    reviewer_id: str
    session_type: ReviewSessionType
    status: ReviewSessionStatus
    scheduled_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
