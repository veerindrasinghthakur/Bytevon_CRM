"""Admin user schemas."""
from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional, Union
from pydantic import BaseModel, EmailStr, Field

class MessageResponse(BaseModel):
    message: str

class AdminUserCreate(BaseModel):
    employmentId: int
    email: EmailStr
    temporaryPassword: str = Field(..., min_length=8)
    roleId: Optional[Union[int, str]] = None
    status: Optional[str] = "ACTIVE"

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    temporaryPassword: Optional[str] = Field(None, min_length=8)
    status: Optional[str] = None
    departmentId: Optional[int] = None
    roleId: Optional[Union[int, str]] = None
    failed_attempt_count: Optional[int] = None
    locked_until: Optional[datetime] = None

class AdminUserListItem(BaseModel):
    id: int
    employmentId: int
    name: str
    email: str
    role: str
    department: str
    status: str
    lastLogin: str
    lastLoginAt: Optional[datetime] = None
    initials: str
    employeeCode: str

class AdminUserListResponse(BaseModel):
    items: List[AdminUserListItem]
    total: int
    locked: int
    active: int
    departments: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)

class EmploymentWithoutLogin(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    department: str
    position: str
    joiningDate: Optional[date] = None

class AdminUserDetailResponse(BaseModel):
    id: int
    employmentId: int
    email: str
    name: str
    status: str
    department: str
    departmentId: Optional[int] = None
    role: str
    roleIds: List[str] = Field(default_factory=list)
    roleNames: List[str] = Field(default_factory=list)
    lastLogin: str
    lastLoginAt: Optional[datetime] = None
    initials: str
    employeeCode: str
    failed_attempt_count: int = 0
    locked_until: Optional[datetime] = None
    person: Optional[dict] = None
    employment: Optional[dict] = None
