"""Audit log endpoints (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_audit_log_repo
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.schemas.audit_log import AuditLogResponse

router = APIRouter()


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_logs_for_entity(
    entity_type: str,
    entity_id: str,
    repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
) -> list[AuditLogResponse]:
    """List audit log entries for an entity."""
    entries = await repo.list_by_entity(entity_type, entity_id)
    return [AuditLogResponse.model_validate(e) for e in entries]
