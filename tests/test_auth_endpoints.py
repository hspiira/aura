"""Auth endpoint tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    """Use asyncio backend for pytest-asyncio."""
    return "asyncio"


@pytest.mark.asyncio
async def test_login_requires_body() -> None:
    """POST /auth/login without body should return 401 (no auth)."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/v1/auth/login")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_unauthenticated() -> None:
    """POST /auth/logout without token should return 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 401
