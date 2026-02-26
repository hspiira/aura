"""FastAPI application: wiring only. No business logic."""

from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers

app = FastAPI(
    title=get_settings().app_name,
    version=get_settings().app_version,
    openapi_url="/api/v1/openapi.json",
    docs_url=None,
    redoc_url=None,
)


@app.get("/", include_in_schema=False)
def root() -> dict:
    """Root: links to API and docs."""
    return {
        "name": get_settings().app_name,
        "description": "Enterprise Performance Management API",
        "api": "/api/v1",
        "openapi": "/api/v1/openapi.json",
        "docs": "/api/v1/docs",
    }


@app.get("/api/v1/docs", include_in_schema=False)
async def scalar_docs() -> object:
    """API reference (Scalar)."""
    return get_scalar_api_reference(
        openapi_url=app.openapi_url or "/api/v1/openapi.json",
        title=f"{get_settings().app_name} API",
    )


register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")
