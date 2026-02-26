"""Department request/response schemas."""

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    """Payload to create a department."""

    organization_id: str
    parent_id: str | None = None
    name: str


class DepartmentResponse(BaseModel):
    """Department in API responses."""

    id: str
    organization_id: str
    parent_id: str | None
    name: str

    model_config = {"from_attributes": True}
