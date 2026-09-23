"""Department operational schemas (workforce — canonical owner)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    department_head_employment_id: int | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    department_head_employment_id: int | None = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    department_head_employment_id: int | None = None
    headName: str | None = Field(None, description="Resolved head display name")
    staffCount: int = Field(0, description="Active employments currently assigned")
    is_archived: bool = False
    created_at: datetime
    created_by: int | None = None


class DepartmentMetrics(BaseModel):
    total: int = 0
    active: int = 0
    archived: int = 0
    staffing: int = 0


class DepartmentListResponse(BaseModel):
    items: list[DepartmentResponse]
    total: int = 0
    metrics: DepartmentMetrics = Field(default_factory=DepartmentMetrics)


class DepartmentEmployee(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    positionName: str = "—"
    state: str
    email: str = ""


class DepartmentEmployeeListResponse(BaseModel):
    items: list[DepartmentEmployee]
    total: int
    page: int = 1
    pageSize: int = 50


class DepartmentAssignRequest(BaseModel):
    employmentId: int


class DepartmentEmployeeOption(BaseModel):
    value: str
    label: str
    meta: str | None = None
