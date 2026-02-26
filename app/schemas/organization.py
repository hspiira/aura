"""Organization request/response schemas."""

from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    """Payload to create an organization."""

    name: str


class OrganizationResponse(BaseModel):
    """Organization in API responses."""

    id: str
    name: str

    model_config = {"from_attributes": True}
