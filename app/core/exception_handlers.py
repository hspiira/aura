"""Centralized exception handlers for the FastAPI app."""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.domain.exceptions import AuraException

logger = logging.getLogger(__name__)

_ERROR_CODE_STATUS: dict[str, int] = {
    "RESOURCE_NOT_FOUND": 404,
    "VALIDATION_ERROR": 400,
    "SERVICE_UNAVAILABLE": 503,
    "TRANSITION_VIOLATION": 409,
}


def _aura_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Map domain exception to JSON response with appropriate status code."""
    assert isinstance(exc, AuraException)
    status = _ERROR_CODE_STATUS.get(exc.error_code, 400)
    return JSONResponse(
        status_code=status,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


def _make_errors_json_safe(obj: Any) -> Any:
    """Convert validation error details to JSON-serializable form."""
    if isinstance(obj, Exception):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _make_errors_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_errors_json_safe(v) for v in obj]
    return obj


def _validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return 422 with validation error details."""
    assert isinstance(exc, RequestValidationError)
    details = _make_errors_json_safe(exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": details,
        },
    )


def _http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return JSON for Starlette HTTP exceptions."""
    assert isinstance(exc, StarletteHTTPException)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTP_ERROR", "message": exc.detail},
    )


def _generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return 500; include detail only when debug is True."""
    logger.exception("Unhandled exception: %s", exc)
    settings = get_settings()
    detail: Any = str(exc) if settings.debug else "Internal server error"
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": detail},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app."""
    app.add_exception_handler(AuraException, _aura_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(Exception, _generic_exception_handler)
