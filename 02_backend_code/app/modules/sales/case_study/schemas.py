"""Case study schemas (V1 stub — no ORM table yet)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class CaseStudyCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    summary: str | None = None
    client_id: int | None = None


class CaseStudyUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    summary: str | None = None


class CaseStudyResponse(BaseModel):
    id: str
    title: str
    summary: str | None = None
    status: str = "draft"
