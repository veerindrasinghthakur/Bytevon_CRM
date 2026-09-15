"""Settings / channel schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ChannelInfo(BaseModel):
    id: str
    name: str
    enabled: bool = True
    description: Optional[str] = None
