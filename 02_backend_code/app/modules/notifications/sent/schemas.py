"""Sent list schemas."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SentListResponse(BaseModel):
    items: list[Any] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    pageSize: int = 20
