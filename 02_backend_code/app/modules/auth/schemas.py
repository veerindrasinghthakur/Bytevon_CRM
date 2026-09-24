"""Pydantic v2 schemas for Authentication module."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.db.enums import DeviceType, SessionStatus


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    device_name: str | None = None
    device_type: DeviceType = DeviceType.OTHER


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


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


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_name: str | None
    device_type: DeviceType
    ip_address: str | None
    status: SessionStatus
    last_used_at: datetime | None
    expires_at: datetime
    created_at: datetime

    @field_validator("ip_address", mode="before")
    @classmethod
    def coerce_ip_to_str(cls, v: object) -> object:        # asyncpg returns INET columns as ipaddress objects; API emits strings.
        return str(v) if v is not None else v


class LoginResponse(BaseModel):
    tokens: TokenPairResponse
    login_id: int
    person_id: int
    employment_id: int | None = None
    email: str
    session_id: int | None = None


class SessionListItem(SessionResponse):
    """Session row for self-service UI: current marker + user agent."""

    current: bool = False
    user_agent: str | None = None


class MessageResponse(BaseModel):
    message: str
