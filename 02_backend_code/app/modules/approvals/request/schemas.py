"""Approval request schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import ApprovalActionType, ApprovalStatus, ApprovalTarget


class MessageResponse(BaseModel):
    message: str


class ApprovalRequestCreate(BaseModel):
    """Called by consumer modules (Leave, Attendance, …) inside their TX."""

    request_type: str = Field(..., min_length=1, max_length=100)
    reference_id: int
    requester_employment_id: int
    target: ApprovalTarget
    target_department_id: int | None = None


class ApprovalActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    approval_request_id: int
    employment_id: int
    action: ApprovalActionType
    remarks: str | None
    created_at: datetime


class ApprovalRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_type: str
    reference_id: int
    requester_employment_id: int
    target: ApprovalTarget
    target_department_id: int | None
    status: ApprovalStatus
    created_at: datetime
    updated_at: datetime


class ApprovalRequestDetailResponse(ApprovalRequestResponse):
    actions: list[ApprovalActionResponse] = Field(default_factory=list)
