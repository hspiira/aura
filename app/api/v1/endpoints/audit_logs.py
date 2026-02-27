"""Audit log endpoints (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_audit_log_repo, require_permission
from app.domain.permissions import VIEW_AUDIT_LOGS
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.schemas.audit_log import AuditLogResponse
from app.schemas.pagination import PageResponse

router = APIRouter()


@router.get("/recent", response_model=list[AuditLogResponse])
async def list_recent_audit_logs(
    repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    _perm: Annotated[None, Depends(require_permission(VIEW_AUDIT_LOGS))],
    entity_type: str = Query(..., description="Filter by entity type (e.g. objective)"),
    limit: int = Query(20, ge=1, le=100),
) -> list[AuditLogResponse]:
    """List most recent audit entries for an entity type (e.g. dashboard feed)."""
    entries = await repo.list_recent_by_entity_type(
        entity_type=entity_type, limit=limit
    )
    return [AuditLogResponse.model_validate(e) for e in entries]


@router.get("", response_model=PageResponse[AuditLogResponse])
async def list_audit_logs_for_entity(
    entity_type: str,
    entity_id: str,
    repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    _perm: Annotated[None, Depends(require_permission(VIEW_AUDIT_LOGS))],
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> PageResponse[AuditLogResponse]:
    """List audit log entries for an entity."""
    entries, total = await repo.list_by_entity_paginated(
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset,
    )
    return PageResponse(
        items=[AuditLogResponse.model_validate(e) for e in entries],
        total=total,
        limit=limit,
        offset=offset,
    )
