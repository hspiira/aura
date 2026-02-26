"""Health endpoint tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    """Use asyncio backend for pytest-asyncio."""
    return "asyncio"


@pytest.mark.asyncio
async def test_health_returns_ok() -> None:
    """GET /api/v1/health returns status ok."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
