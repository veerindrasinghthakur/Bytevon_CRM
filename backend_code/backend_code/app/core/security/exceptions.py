"""Security-related domain exceptions."""

from __future__ import annotations


class SecurityException(Exception):
    """Base for security/auth token errors."""

    def __init__(self, message: str = "Security error") -> None:
        self.message = message
        super().__init__(message)


class InvalidTokenException(SecurityException):
    def __init__(self) -> None:
        super().__init__("Invalid token")


class ExpiredTokenException(SecurityException):
    def __init__(self) -> None:
        super().__init__("Token has expired")


class InvalidTokenTypeException(SecurityException):
    def __init__(self) -> None:
        super().__init__("Invalid token type")
