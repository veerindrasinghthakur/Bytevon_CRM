"""Authentication module domain exceptions."""

from __future__ import annotations

from app.core.exceptions.exception import AppException, UnauthorizedError, DomainError


class InvalidCredentialsException(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__(message="Invalid email or password", code="invalid_credentials")


class AccountLockedException(UnauthorizedError):
    def __init__(self, locked_until: str | None = None) -> None:
        msg = "Account is temporarily locked due to too many failed attempts"
        if locked_until:
            msg = f"{msg} until {locked_until}"
        super().__init__(message=msg, code="account_locked")


class AccountInactiveException(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__(message="Account is inactive", code="account_inactive")


class SessionRevokedException(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__(message="Session has been revoked", code="session_revoked")


class SessionExpiredException(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__(message="Session has expired", code="session_expired")


class InvalidSessionException(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__(message="Invalid session", code="invalid_session")


class InvalidPasswordResetTokenException(DomainError):
    def __init__(self) -> None:
        super().__init__(message="Invalid or expired password reset token", code="invalid_reset_token")


class PasswordResetAlreadyUsedException(DomainError):
    def __init__(self) -> None:
        super().__init__(message="Password reset token has already been used", code="reset_token_used")
