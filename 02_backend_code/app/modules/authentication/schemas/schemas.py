"""
Pydantic v2 schemas for Authentication module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import DeviceType, SessionRevokeReason, SessionStatus


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    device_name: Optional[str] = None
    device_type: DeviceType = DeviceType.OTHER


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None  # if omitted, revoke current session only via access


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    revoke_all_sessions: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class RevokeSessionRequest(BaseModel):
    session_id: int


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds for access token


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_name: Optional[str]
    device_type: DeviceType
    ip_address: Optional[str]
    status: SessionStatus
    last_used_at: Optional[datetime]
    expires_at: datetime
    created_at: datetime


class LoginResponse(BaseModel):
    tokens: TokenPairResponse
    login_id: int
    person_id: int
    email: str


class MessageResponse(BaseModel):
    message: str
