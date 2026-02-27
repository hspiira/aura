"""Notification service: emit events based on rules, log deliveries.

Initial implementation: single in-app channel that writes to NotificationLog.
"""

from __future__ import annotations

from typing import Any

from app.infrastructure.persistence.models.notification_log import NotificationLog
from app.infrastructure.persistence.repositories.notification_log_repo import (
    NotificationLogRepository,
)
from app.infrastructure.persistence.repositories.notification_rule_repo import (
    NotificationRuleRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository


async def emit_event(
    event_type: str,
    context: dict[str, Any],
    rule_repo: NotificationRuleRepository,
    log_repo: NotificationLogRepository,
    user_repo: UserRepository,
) -> None:
    """Emit an event: resolve rules, recipients, and append NotificationLog entries.

    For now we support a single logical channel: "in_app". The rule's template_body,
    when present, can use Python str.format(**context) placeholders; failures in
    template rendering are captured in error_message and status="error".
    """
    rules = await rule_repo.list_by_event_type(event_type)
    if not rules:
        return

    # Load all users once and group by role_id for simple recipient resolution.
    users = await user_repo.list_all()
    users_by_role: dict[str, list[str]] = {}
    for user in users:
        users_by_role.setdefault(user.role_id, []).append(user.id)

    for rule in rules:
        recipient_ids = users_by_role.get(rule.recipient_role_id, [])
        if not recipient_ids:
            continue

        for user_id in recipient_ids:
            error_message: str | None = None
            status = "sent"

            # Render template if present; errors are non-fatal and recorded.
            if rule.template_body:
                try:
                    _ = rule.template_body.format(**context)
                except Exception as exc:  # pragma: no cover - defensive
                    status = "error"
                    error_message = f"template render failed: {exc}"

            entry = NotificationLog(
                event_type=event_type,
                recipient_id=user_id,
                channel=rule.channel or "in_app",
                status=status,
                error_message=error_message,
            )
            await log_repo.add(entry)
