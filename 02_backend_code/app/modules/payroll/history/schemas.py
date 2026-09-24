"""History list item (UI)."""
from __future__ import annotations

from pydantic import BaseModel


class HistoryItem(BaseModel):
    id: str
    period: str
    employeeId: str = ""
    paidOn: str = ""
    gross: float = 0
    net: float = 0
    ref: str | None = None
