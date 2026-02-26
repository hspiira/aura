"""Role request/response schemas."""

from pydantic import BaseModel


class RoleCreate(BaseModel):
    """Payload to create a role."""

    department_id: str
    name: str
    level: str | None = None
    is_managerial: bool = False


class RoleResponse(BaseModel):
    """Role in API responses."""

    id: str
    department_id: str
    name: str
    level: str | None
    is_managerial: bool

    model_config = {"from_attributes": True}
