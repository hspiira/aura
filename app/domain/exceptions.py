"""Domain exceptions for the Aura EPM application.

Mapped to HTTP responses by app.core.exception_handlers.
"""

from typing import Any


class AuraException(Exception):
    """Base exception for all Aura application errors."""

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ResourceNotFoundException(AuraException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, resource_id: str) -> None:
        details = {"resource_type": resource_type, "resource_id": resource_id}
        super().__init__(
            f"{resource_type} not found: {resource_id}",
            "RESOURCE_NOT_FOUND",
            details,
        )


class SqlNotConfiguredException(AuraException):
    """Raised when an operation requires a database that is not configured."""

    def __init__(self) -> None:
        super().__init__(
            "This operation requires a database that is not configured.",
            "SERVICE_UNAVAILABLE",
        )
