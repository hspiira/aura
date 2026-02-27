"""Objective validation request/response schemas (SMART validation)."""

from pydantic import BaseModel


class ValidateObjectiveRequest(BaseModel):
    """Request body for objective validation."""

    objective_id: str


class ValidateObjectiveResponse(BaseModel):
    """Response from objective validation."""

    valid: bool
    errors: list[str]
