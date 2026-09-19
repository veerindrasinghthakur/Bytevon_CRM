"""Department schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    department_head_employment_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    department_head_employment_id: Optional[int] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    department_head_employment_id: Optional[int] = None
    is_archived: bool = False
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None


class DepartmentEmployee(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    positionName: str = "—"
    state: str
    email: str = ""


class DepartmentEmployeeListResponse(BaseModel):
    items: List[DepartmentEmployee]
    total: int
    page: int = 1
    pageSize: int = 50


class DepartmentAssignRequest(BaseModel):
    employmentId: int


class DepartmentEmployeeOption(BaseModel):
    value: str
    label: str
    meta: Optional[str] = None
