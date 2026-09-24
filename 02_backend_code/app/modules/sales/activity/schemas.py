"""Activity schemas."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ActivityCreate(BaseModel):
    text: str
    type: str = "note"
    lead_id: int | None = None
    client_id: int | None = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    text: str
    time: str
    type: str
