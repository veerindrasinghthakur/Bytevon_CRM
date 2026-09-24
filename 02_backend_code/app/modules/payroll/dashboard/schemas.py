"""Dashboard response shapes (loose UI dicts)."""
from __future__ import annotations

from pydantic import BaseModel


class PeriodInfo(BaseModel):
    year: int
    month: int
    label: str
    status: str = "OPEN"
