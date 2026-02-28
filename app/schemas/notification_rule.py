"""Notification rule request/response schemas."""

from pydantic import BaseModel


class NotificationRuleCreate(BaseModel):
    """Payload to create a notification rule."""

    event_type: str
    recipient_role_id: str
    channel: str
    template_body: str | None = None


class NotificationRuleUpdate(BaseModel):
    """Payload to update a notification rule (partial)."""

    event_type: str | None = None
    recipient_role_id: str | None = None
    channel: str | None = None
    template_body: str | None = None


class NotificationRuleResponse(BaseModel):
    """Notification rule in API responses."""

    id: str
    event_type: str
    recipient_role_id: str
    channel: str
    template_body: str | None

    model_config = {"from_attributes": True}
