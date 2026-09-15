"""My-work profile schemas."""
from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ProfileMeResponse(BaseModel):
    loginId: Optional[int] = None
    employmentId: Optional[int] = None
    name: str = ""
    email: str = ""
    avatarUrl: Optional[str] = None
    title: str = ""
    department: str = ""
    phone: str = ""


class ProfileMeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    avatarUrl: Optional[str] = None


class ProfileActivityResponse(BaseModel):
    items: List[Any] = Field(default_factory=list)
    total: int = 0
    limit: int = 20


class ProfileSessionItem(BaseModel):
    id: Optional[int] = None
    createdAt: Optional[str] = None
    lastSeenAt: Optional[str] = None
    userAgent: Optional[str] = None
    ip: Optional[str] = None
