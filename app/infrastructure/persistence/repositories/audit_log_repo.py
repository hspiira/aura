"""Audit log repository."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.audit_log import AuditLog
from app.shared.utils.datetime import utc_now


class AuditLogRepository:
    """Repository for AuditLog (append-only)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_entity(self, entity_type: str, entity_id: str) -> list[AuditLog]:
        """Return audit entries for an entity."""
        result = await self._session.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.changed_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_entity_paginated(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        """Return page of audit entries for an entity and total count."""
        count_result = await self._session.execute(
            select(func.count())
            .select_from(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
        )
        total = count_result.scalar_one()
        result = await self._session.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.changed_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def add(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        old_value: dict | None = None,
        new_value: dict | None = None,
        changed_by: str | None = None,
        changed_at: datetime | None = None,
    ) -> AuditLog:
        """Append an audit log entry."""
        entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            changed_by=changed_by,
            changed_at=changed_at or utc_now(),
        )
        self._session.add(entry)
        await self._session.flush()
        await self._session.refresh(entry)
        return entry
