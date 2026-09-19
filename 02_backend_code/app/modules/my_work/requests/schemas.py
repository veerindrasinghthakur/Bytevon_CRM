"""My Work Requests schemas."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class ApprovalRow(BaseModel):
    id: str
    type: str
    reason: str = ""
    status: str
    submitted_on: date | None = None
    approver: str | None = None


class RequestListResponse(BaseModel):
    items: list[ApprovalRow]
    total: int
    page: int = 1
    pageSize: int = 20
