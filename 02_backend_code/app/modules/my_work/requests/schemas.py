"""My Work Requests schemas."""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class ApprovalRow(BaseModel):
    id: str
    type: str
    reason: str = ""
    status: str
    submitted_on: Optional[date] = None
    approver: Optional[str] = None


class RequestListResponse(BaseModel):
    items: List[ApprovalRow]
    total: int
    page: int = 1
    pageSize: int = 20
