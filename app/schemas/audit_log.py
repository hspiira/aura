"""Audit log response schema (read-only)."""

from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    """Audit log entry in API responses."""

    id: str
    entity_type: str
    entity_id: str
    action: str
    old_value: dict | None
    new_value: dict | None
    changed_by: str | None
    changed_at: datetime

    model_config = {"from_attributes": True}
