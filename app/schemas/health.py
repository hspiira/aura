"""Health check response schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Liveness/health check response."""

    status: str = "ok"
