"""
JWT token payload models (Pydantic v2).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TokenPayload(BaseModel):
    """Claims carried by access and refresh tokens."""

    sub: str = Field(..., description="Login ID as string")
    login_id: int
    person_id: int
    employment_id: int | None = None  # current active employment if known
    type: str  # "access" | "refresh"
    exp: datetime
    iat: datetime | None = None
    jti: str | None = None  # session id or unique token id for refresh
