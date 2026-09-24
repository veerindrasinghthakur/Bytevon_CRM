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
    employeeCode: str = ""
    joiningDate: str | None = None
    position: str = ""
    workMode: str = ""
    location: str = ""
    dateOfBirth: str | None = None
    managerName: str = ""
    employmentType: str = ""
    employmentState: str = ""


class ProfileMeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=201)
    phone: str | None = Field(None, max_length=20)
    dateOfBirth: str | None = None


class ProfileActivityItem(BaseModel):
    id: str
    title: str
    module: str
    time: str
    status: str
    icon: str


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


class ProfilePreferencesResponse(BaseModel):
    language: str = "en"
    theme: str = "system"
    timezone: str | None = None
    location: str | None = None
    emailNotifications: bool = True
    desktopPush: bool = True
    avatarUrl: str | None = None


class ProfilePreferencesUpdate(BaseModel):
    language: str | None = Field(None, max_length=10)
    theme: str | None = Field(None, max_length=20)
    timezone: str | None = Field(None, max_length=64)
    location: str | None = Field(None, max_length=255)
    emailNotifications: bool | None = None
    desktopPush: bool | None = None
