"""Calibration session repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.calibration_session import (
    CalibrationSession,
)
from app.infrastructure.persistence.persist import persist_and_refresh


class CalibrationSessionRepository:
    """Repository for CalibrationSession entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[CalibrationSession]:
        """Return all calibration sessions."""
        result = await self._session.execute(
            select(CalibrationSession).order_by(
                CalibrationSession.conducted_at.desc(),
                CalibrationSession.created_at.desc(),
            )
        )
        return list(result.scalars().all())

    async def list_by_cycle(
        self, performance_cycle_id: str
    ) -> list[CalibrationSession]:
        """Return sessions for a performance cycle."""
        result = await self._session.execute(
            select(CalibrationSession)
            .where(
                CalibrationSession.performance_cycle_id == performance_cycle_id,
            )
            .order_by(CalibrationSession.conducted_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_department(
        self, department_id: str
    ) -> list[CalibrationSession]:
        """Return sessions for a department."""
        result = await self._session.execute(
            select(CalibrationSession)
            .where(CalibrationSession.department_id == department_id)
            .order_by(CalibrationSession.conducted_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> CalibrationSession | None:
        """Return one session by id."""
        result = await self._session.execute(
            select(CalibrationSession).where(CalibrationSession.id == id)
        )
        return result.scalar_one_or_none()

    async def add(self, session: CalibrationSession) -> CalibrationSession:
        """Persist a calibration session."""
        return await persist_and_refresh(self._session, session)
