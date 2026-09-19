"""Leave request schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator

from app.core.db.enums import LeaveRequestStatus, LeaveType


class LeaveRequestCreate(BaseModel):
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str | None = None
    target_department_id: int | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> LeaveRequestCreate:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str | None
    approval_request_id: int | None
    status: LeaveRequestStatus
    days: Decimal | None
    created_at: datetime
    updated_at: datetime
