"""My Work Approvals schemas."""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class ApprovalRequest(BaseModel):
    id: str
    request_type: str
    request_reason: str = ""
    status: str
    submitted_on: Optional[date] = None
    requester: Optional[str] = None


class ApprovalListResponse(BaseModel):
    items: List[ApprovalRequest]
    total: int
    page: int = 1
    pageSize: int = 20
