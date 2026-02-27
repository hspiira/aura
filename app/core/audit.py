"""Audit logging helper for consistent append-only events."""

from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)


async def audit_log(
    repo: AuditLogRepository,
    entity_type: str,
    entity_id: str,
    action: str,
    old_value: dict | None = None,
    new_value: dict | None = None,
    changed_by: str | None = None,
) -> None:
    """Append an audit log entry (no PII in old_value/new_value)."""
    await repo.add(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        changed_by=changed_by,
    )
