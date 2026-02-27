"""Notification log response schema (read-only, append-only)."""

from datetime import datetime

from pydantic import BaseModel


class NotificationLogResponse(BaseModel):
    """Notification log entry in API responses."""

    id: str
    event_type: str
    recipient_id: str | None
    channel: str
    sent_at: datetime
    status: str
    error_message: str | None

    model_config = {"from_attributes": True}
