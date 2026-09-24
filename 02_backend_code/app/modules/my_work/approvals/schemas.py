"""My Work Approvals schemas."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class ApprovalRequest(BaseModel):
    id: str
    request_type: str
    request_reason: str = ""
    status: str
    submitted_on: date | None = None
    requester: str | None = None
    title: str = ""
    summary: str = ""


class ApprovalListResponse(BaseModel):
    items: list[ApprovalRequest]
    total: int
    page: int = 1
    pageSize: int = 20
