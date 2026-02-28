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


class ValidationException(AuraException):
    """Raised when domain/application validation fails (e.g. SMART)."""

    def __init__(self, message: str, errors: list[str] | None = None) -> None:
        details = {"errors": errors or []}
        super().__init__(message, "VALIDATION_ERROR", details)


class ResourceNotFoundException(AuraException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, resource_id: str) -> None:
        details = {"resource_type": resource_type, "resource_id": resource_id}
        super().__init__(
            f"{resource_type} not found: {resource_id}",
            "RESOURCE_NOT_FOUND",
            details,
        )


class TransitionViolationException(AuraException):
    """Raised when an objective status transition is not allowed."""

    def __init__(self, message: str, from_status: str, to_status: str) -> None:
        super().__init__(
            message,
            "TRANSITION_VIOLATION",
            {"from_status": from_status, "to_status": to_status},
        )


class ConflictException(AuraException):
    """Raised when a concurrent modification is detected (optimistic lock conflict)."""

    def __init__(self, message: str, entity_type: str, entity_id: str) -> None:
        details = {"entity_type": entity_type, "entity_id": entity_id}
        super().__init__(message, "CONFLICT", details)


class SqlNotConfiguredException(AuraException):
    """Raised when an operation requires a database that is not configured."""

    def __init__(self) -> None:
        super().__init__(
            "This operation requires a database that is not configured.",
            "SERVICE_UNAVAILABLE",
        )
