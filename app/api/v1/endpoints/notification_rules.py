"""Notification rule endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_notification_rule_repo,
    get_role_repo,
    require_permission,
)
from app.api.v1.helpers import get_one_or_raise
from app.domain.permissions import MANAGE_NOTIFICATIONS
from app.infrastructure.persistence.models.notification_rule import (
    NotificationRule,
)
from app.infrastructure.persistence.repositories.notification_rule_repo import (
    NotificationRuleRepository,
)
from app.infrastructure.persistence.repositories.role_repo import RoleRepository
from app.schemas.notification_rule import (
    NotificationRuleCreate,
    NotificationRuleResponse,
)

router = APIRouter()


@router.get("", response_model=list[NotificationRuleResponse])
async def list_notification_rules(
    repo: Annotated[NotificationRuleRepository, Depends(get_notification_rule_repo)],
    event_type: str | None = Query(None),
    _perm: Annotated[None, Depends(require_permission(MANAGE_NOTIFICATIONS))] = None,
) -> list[NotificationRuleResponse]:
    """List notification rules; optionally filter by event_type."""
    if event_type:
        items = await repo.list_by_event_type(event_type)
    else:
        items = await repo.list_all()
    return [NotificationRuleResponse.model_validate(i) for i in items]


@router.post("", response_model=NotificationRuleResponse, status_code=201)
async def create_notification_rule(
    payload: NotificationRuleCreate,
    repo: Annotated[NotificationRuleRepository, Depends(get_notification_rule_repo)],
    role_repo: Annotated[RoleRepository, Depends(get_role_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_NOTIFICATIONS))] = None,
) -> NotificationRuleResponse:
    """Create a notification rule."""
    await get_one_or_raise(
        role_repo.get_by_id(payload.recipient_role_id),
        payload.recipient_role_id,
        "Role",
    )
    rule = NotificationRule(
        event_type=payload.event_type,
        recipient_role_id=payload.recipient_role_id,
        channel=payload.channel,
        template_body=payload.template_body,
    )
    rule = await repo.add(rule)
    return NotificationRuleResponse.model_validate(rule)


@router.get("/{id}", response_model=NotificationRuleResponse)
async def get_notification_rule(
    id: str,
    repo: Annotated[NotificationRuleRepository, Depends(get_notification_rule_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_NOTIFICATIONS))] = None,
) -> NotificationRuleResponse:
    """Get one notification rule by id."""
    rule = await get_one_or_raise(repo.get_by_id(id), id, "NotificationRule")
    return NotificationRuleResponse.model_validate(rule)
