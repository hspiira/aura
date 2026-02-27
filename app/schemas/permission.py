"""Permission request/response schemas."""

from pydantic import BaseModel


class PermissionCreate(BaseModel):
    """Payload to create a permission."""

    code: str
    name: str
    description: str | None = None


class PermissionResponse(BaseModel):
    """Permission in API responses."""

    id: str
    code: str
    name: str
    description: str | None

    model_config = {"from_attributes": True}
