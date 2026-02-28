"""Notification log endpoints (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_notification_log_repo,
    get_user_repo,
    require_permission,
)
from app.domain.permissions import VIEW_AUDIT_LOGS
from app.infrastructure.persistence.repositories.notification_log_repo import (
    NotificationLogRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository
from app.schemas.notification_log import NotificationLogResponse
from app.schemas.pagination import PageResponse

router = APIRouter()


@router.get("", response_model=PageResponse[NotificationLogResponse])
async def list_notification_logs(
    repo: Annotated[NotificationLogRepository, Depends(get_notification_log_repo)],
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    event_type: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _perm: Annotated[None, Depends(require_permission(VIEW_AUDIT_LOGS))] = None,
) -> PageResponse[NotificationLogResponse]:
    """List notification log entries (newest first). Optionally filter by event_type."""
    items, total = await repo.list_paginated(
        limit=limit,
        offset=offset,
        event_type=event_type,
    )
    recipient_ids = [i.recipient_id for i in items if i.recipient_id]
    users = await user_repo.get_by_ids(recipient_ids)
    name_by_id = {u.id: u.name for u in users}
    response_items = [
        NotificationLogResponse(
            id=i.id,
            event_type=i.event_type,
            recipient_id=i.recipient_id,
            recipient_name=name_by_id.get(i.recipient_id) if i.recipient_id else None,
            channel=i.channel,
            sent_at=i.sent_at,
            status=i.status,
            error_message=i.error_message,
        )
        for i in items
    ]
    return PageResponse(
        items=response_items,
        total=total,
        limit=limit,
        offset=offset,
    )
