"""Notification log endpoints (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_notification_log_repo, require_permission
from app.domain.permissions import VIEW_AUDIT_LOGS
from app.infrastructure.persistence.repositories.notification_log_repo import (
    NotificationLogRepository,
)
from app.schemas.notification_log import NotificationLogResponse

router = APIRouter()


@router.get("", response_model=list[NotificationLogResponse])
async def list_notification_logs(
    repo: Annotated[NotificationLogRepository, Depends(get_notification_log_repo)],
    event_type: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    _perm: Annotated[None, Depends(require_permission(VIEW_AUDIT_LOGS))] = None,
) -> list[NotificationLogResponse]:
    """List notification log entries (newest first). Optionally filter by event_type."""
    if event_type:
        items = await repo.list_by_event_type(event_type, limit=limit)
    else:
        items = await repo.list_all(limit=limit)
    return [NotificationLogResponse.model_validate(i) for i in items]
