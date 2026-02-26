"""Calibration session request/response schemas."""

from datetime import datetime

from pydantic import BaseModel


class CalibrationSessionCreate(BaseModel):
    """Payload to create a calibration session."""

    performance_cycle_id: str
    department_id: str
    conducted_by_id: str
    conducted_at: datetime
    notes: str | None = None


class CalibrationSessionResponse(BaseModel):
    """Calibration session in API responses."""

    id: str
    performance_cycle_id: str
    department_id: str
    conducted_by_id: str
    conducted_at: datetime
    notes: str | None

    model_config = {"from_attributes": True}
