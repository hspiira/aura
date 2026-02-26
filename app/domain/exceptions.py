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
