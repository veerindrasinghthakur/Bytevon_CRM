"""Activity schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActivityCreate(BaseModel):
    text: str
    type: str = "note"
    lead_id: Optional[int] = None
    client_id: Optional[int] = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    text: str
    time: str
    type: str
