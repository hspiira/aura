"""Objective evidence request/response schemas."""

from pydantic import BaseModel


class ObjectiveEvidenceCreate(BaseModel):
    """Payload to create objective evidence."""

    objective_id: str
    description: str | None = None
    file_path: str | None = None
    uploaded_by: str


class ObjectiveEvidenceResponse(BaseModel):
    """Objective evidence in API responses."""

    id: str
    objective_id: str
    description: str | None
    file_path: str | None
    uploaded_by: str

    model_config = {"from_attributes": True}
