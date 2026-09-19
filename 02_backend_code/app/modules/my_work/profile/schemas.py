"""My-work profile schemas."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ProfileMeResponse(BaseModel):
    loginId: int | None = None
    employmentId: int | None = None
    name: str = ""
    email: str = ""
    avatarUrl: str | None = None
    title: str = ""
    department: str = ""
    phone: str = ""


class ProfileMeUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    title: str | None = None
    avatarUrl: str | None = None


class ProfileActivityResponse(BaseModel):
    items: list[Any] = Field(default_factory=list)
    total: int = 0
    limit: int = 20


class ProfileSessionItem(BaseModel):
    id: int | None = None
    createdAt: str | None = None
    lastSeenAt: str | None = None
    userAgent: str | None = None
    ip: str | None = None
