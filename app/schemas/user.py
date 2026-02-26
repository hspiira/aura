"""User request/response schemas."""

from pydantic import BaseModel


class UserCreate(BaseModel):
    """Payload to create a user."""

    role_id: str
    department_id: str
    supervisor_id: str | None = None
    name: str
    email: str | None = None


class UserResponse(BaseModel):
    """User in API responses."""

    id: str
    role_id: str
    department_id: str
    supervisor_id: str | None
    name: str
    email: str | None

    model_config = {"from_attributes": True}
