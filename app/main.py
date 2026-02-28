"""FastAPI application: wiring only. No business logic."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from scalar_fastapi import get_scalar_api_reference

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.lifespan import lifespan
from app.pages import render_landing_page

app = FastAPI(
    title=get_settings().app_name,
    version=get_settings().app_version,
    openapi_url="/api/v1/openapi.json",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def root() -> HTMLResponse:
    """Landing page with grid and API links."""
    settings = get_settings()
    return HTMLResponse(content=render_landing_page(settings.app_name))


@app.get("/docs", include_in_schema=False)
def docs_redirect() -> RedirectResponse:
    """Redirect /docs to Scalar API reference."""
    return RedirectResponse(url="/api/v1/docs", status_code=302)


@app.get("/api/v1/docs", include_in_schema=False)
async def scalar_docs() -> object:
    """API reference (Scalar)."""
    return get_scalar_api_reference(
        openapi_url=app.openapi_url or "/api/v1/openapi.json",
        title=f"{get_settings().app_name} API",
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")
