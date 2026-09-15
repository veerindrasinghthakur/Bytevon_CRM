"""Dashboard response shapes (loose UI dicts)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PeriodInfo(BaseModel):
    year: int
    month: int
    label: str
    status: str = "OPEN"
