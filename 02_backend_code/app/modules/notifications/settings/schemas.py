"""Settings / channel schemas."""
from __future__ import annotations

from pydantic import BaseModel


class ChannelInfo(BaseModel):
    id: str
    name: str
    enabled: bool = True
    description: str | None = None
