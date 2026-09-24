"""
Core domain and HTTP-mappable exceptions.

Authorization status contract (final):
  ForbiddenError (403)
    - Actor has no grant at all for the resource+action, OR
    - Relationship / business-policy denial (e.g. not the department head),
      OR
    - Sensitive-field denial (write/update of a field the actor cannot touch).
  NotFoundError (404)
    - Permission exists, but the target is missing or out of the actor's
      data scope (scoped query returns zero rows). Missing and out-of-scope
      are intentionally indistinguishable.

Non-authorization uses of these classes (plain missing rows, etc.) stay as-is.
"""

from __future__ import annotations

from typing import Any


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str = "An application error occurred",
        *,
        code: str = "app_error",
        status_code: int = 400,
        details: Any | None = None,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundError(AppException):
    """
    HTTP 404.

    Authorization use (final rule):
      Actor *has* a grant for the resource+action, but the target is missing
      or outside their resolved data scope. Missing and out-of-scope must
      look identical to the client.

    Non-authorization use: ordinary "row not found" after a legitimate lookup
    (untouched by this rule).
    """

    def __init__(self, message: str = "Resource not found", **kwargs: Any) -> None:
        code = kwargs.pop("code", "not_found")
        status_code = kwargs.pop("status_code", 404)
        super().__init__(message, code=code, status_code=status_code, **kwargs)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", **kwargs: Any) -> None:
        code = kwargs.pop("code", "validation_error")
        status_code = kwargs.pop("status_code", 422)
        super().__init__(message, code=code, status_code=status_code, **kwargs)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict", **kwargs: Any) -> None:
        code = kwargs.pop("code", "conflict")
        status_code = kwargs.pop("status_code", 409)
        super().__init__(message, code=code, status_code=status_code, **kwargs)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Unauthorized", **kwargs: Any) -> None:
        code = kwargs.pop("code", "unauthorized")
        status_code = kwargs.pop("status_code", 401)
        super().__init__(message, code=code, status_code=status_code, **kwargs)


class ForbiddenError(AppException):
    """
    HTTP 403.

    Authorization use (final rule):
      - No grant at all for the resource+action, OR
      - Relationship / business-policy denial (e.g. not a valid approver), OR
      - Sensitive-field denial (actor may not read/update that field).

    Do **not** use 403 to hide out-of-scope targets — those are NotFoundError.
    """

    def __init__(self, message: str = "Forbidden", **kwargs: Any) -> None:
        code = kwargs.pop("code", "forbidden")
        status_code = kwargs.pop("status_code", 403)
        super().__init__(message, code=code, status_code=status_code, **kwargs)


class DomainError(AppException):
    """Business rule violation."""

    def __init__(self, message: str, **kwargs: Any) -> None:
        code = kwargs.pop("code", "domain_error")
        status_code = kwargs.pop("status_code", 400)
        super().__init__(message, code=code, status_code=status_code, **kwargs)
