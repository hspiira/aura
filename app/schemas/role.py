"""Role request/response schemas."""

from pydantic import BaseModel


class RoleCreate(BaseModel):
    """Payload to create a role."""

    department_id: str
    name: str
    level: str | None = None
    is_managerial: bool = False


class RoleUpdate(BaseModel):
    """Payload to update a role (partial)."""

    department_id: str | None = None
    name: str | None = None
    level: str | None = None
    is_managerial: bool | None = None


class RoleResponse(BaseModel):
    """Role in API responses."""

    id: str
    department_id: str
    name: str
    level: str | None
    is_managerial: bool

    model_config = {"from_attributes": True}
