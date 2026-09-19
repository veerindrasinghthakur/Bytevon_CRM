"""Admin user schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class MessageResponse(BaseModel):
    message: str

class AdminUserCreate(BaseModel):
    employmentId: int
    email: EmailStr
    temporaryPassword: str = Field(..., min_length=8)
    roleId: int | str | None = None
    status: str | None = "ACTIVE"

class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    temporaryPassword: str | None = Field(None, min_length=8)
    status: str | None = None
    departmentId: int | None = None
    roleId: int | str | None = None
    failed_attempt_count: int | None = None
    locked_until: datetime | None = None

class AdminUserListItem(BaseModel):
    id: int
    employmentId: int
    name: str
    email: str
    role: str
    department: str
    status: str
    lastLogin: str
    lastLoginAt: datetime | None = None
    initials: str
    employeeCode: str

class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    locked: int
    active: int
    departments: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=list)

class EmploymentWithoutLogin(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    department: str
    position: str
    joiningDate: date | None = None

class AdminUserDetailResponse(BaseModel):
    id: int
    employmentId: int
    email: str
    name: str
    status: str
    department: str
    departmentId: int | None = None
    role: str
    roleIds: list[str] = Field(default_factory=list)
    roleNames: list[str] = Field(default_factory=list)
    lastLogin: str
    lastLoginAt: datetime | None = None
    initials: str
    employeeCode: str
    failed_attempt_count: int = 0
    locked_until: datetime | None = None
    person: dict | None = None
    employment: dict | None = None
