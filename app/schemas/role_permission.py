"""RolePermission request/response schemas."""

from pydantic import BaseModel


class RolePermissionCreate(BaseModel):
    """Payload to assign a permission to a role."""

    role_id: str
    permission_id: str


class RolePermissionResponse(BaseModel):
    """Role-permission link in API responses."""

    id: str
    role_id: str
    permission_id: str

    model_config = {"from_attributes": True}
