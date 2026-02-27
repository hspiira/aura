"""Calibration session endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_calibration_session_repo,
)
from app.api.v1.helpers import get_one_or_raise
from app.core.audit import audit_log
from app.core.auth import CurrentUserIdOptional
from app.infrastructure.persistence.models.calibration_session import (
    CalibrationSession,
)
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.calibration_session_repo import (
    CalibrationSessionRepository,
)
from app.schemas.calibration_session import (
    CalibrationSessionCreate,
    CalibrationSessionResponse,
)

router = APIRouter()


@router.get("", response_model=list[CalibrationSessionResponse])
async def list_calibration_sessions(
    repo: Annotated[
        CalibrationSessionRepository, Depends(get_calibration_session_repo)
    ],
    performance_cycle_id: str | None = Query(None),
    department_id: str | None = Query(None),
) -> list[CalibrationSessionResponse]:
    """List calibration sessions; filter by cycle and/or department when set."""
    if performance_cycle_id and department_id:
        items = await repo.list_by_cycle_and_department(
            performance_cycle_id, department_id
        )
    elif performance_cycle_id:
        items = await repo.list_by_cycle(performance_cycle_id)
    elif department_id:
        items = await repo.list_by_department(department_id)
    else:
        items = await repo.list_all()
    return [CalibrationSessionResponse.model_validate(i) for i in items]


@router.post("", response_model=CalibrationSessionResponse, status_code=201)
async def create_calibration_session(
    payload: CalibrationSessionCreate,
    repo: Annotated[
        CalibrationSessionRepository, Depends(get_calibration_session_repo)
    ],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
) -> CalibrationSessionResponse:
    """Create a calibration session."""
    session = CalibrationSession(
        performance_cycle_id=payload.performance_cycle_id,
        department_id=payload.department_id,
        conducted_by_id=payload.conducted_by_id,
        conducted_at=payload.conducted_at,
        notes=payload.notes,
    )
    session = await repo.add(session)
    await audit_log(
        audit_repo,
        "calibration_session",
        session.id,
        "create",
        new_value={"performance_cycle_id": session.performance_cycle_id, "department_id": session.department_id},
        changed_by=changed_by,
    )
    return CalibrationSessionResponse.model_validate(session)


@router.get("/{id}", response_model=CalibrationSessionResponse)
async def get_calibration_session(
    id: str,
    repo: Annotated[
        CalibrationSessionRepository, Depends(get_calibration_session_repo)
    ],
) -> CalibrationSessionResponse:
    """Get one calibration session by id."""
    session = await get_one_or_raise(repo.get_by_id(id), id, "CalibrationSession")
    return CalibrationSessionResponse.model_validate(session)
