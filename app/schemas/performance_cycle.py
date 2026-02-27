"""Performance cycle request/response schemas."""

from datetime import date, datetime

from pydantic import BaseModel


class PerformanceCycleCreate(BaseModel):
    """Payload to create a performance cycle."""

    name: str
    start_date: date
    end_date: date
    status: str = "draft"
    review_frequency: str | None = None


class PerformanceCycleResponse(BaseModel):
    """Performance cycle in API responses."""

    id: str
    name: str
    start_date: date
    end_date: date
    status: str
    review_frequency: str | None
    objectives_lock_date: date | None = None
    objectives_locked_at: datetime | None = None

    model_config = {"from_attributes": True}
