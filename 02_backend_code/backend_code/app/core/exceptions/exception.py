"""
Core domain and HTTP-mappable exceptions.
"""

from __future__ import annotations

from typing import Any, Optional


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str = "An application error occurred",
        *,
        code: str = "app_error",
        status_code: int = 400,
        details: Optional[Any] = None,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", **kwargs: Any) -> None:
        super().__init__(message, code="not_found", status_code=404, **kwargs)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", **kwargs: Any) -> None:
        super().__init__(message, code="validation_error", status_code=422, **kwargs)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict", **kwargs: Any) -> None:
        super().__init__(message, code="conflict", status_code=409, **kwargs)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Unauthorized", **kwargs: Any) -> None:
        super().__init__(message, code="unauthorized", status_code=401, **kwargs)


class ForbiddenError(AppException):
    """
    Prefer 404 for most authorization failures per architecture (hide existence).
    Use this only for explicit sensitive-field or action denials where 403 is intended.
    """

    def __init__(self, message: str = "Forbidden", **kwargs: Any) -> None:
        super().__init__(message, code="forbidden", status_code=403, **kwargs)


class DomainError(AppException):
    """Business rule violation."""

    def __init__(self, message: str, **kwargs: Any) -> None:
        super().__init__(message, code="domain_error", status_code=400, **kwargs)
