"""Case study schemas (V1 stub — no ORM table yet)."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class CaseStudyCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    summary: Optional[str] = None
    client_id: Optional[int] = None


class CaseStudyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    summary: Optional[str] = None


class CaseStudyResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    status: str = "draft"
