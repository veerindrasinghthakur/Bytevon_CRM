"""Organization settings schemas."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class OrganizationSettingsUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    head_office_location_id: Optional[int] = None
    default_timezone: Optional[str] = None
    default_currency: Optional[str] = None
    logo_reference: Optional[str] = None

class OrganizationSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_name: str
    head_office_location_id: Optional[int] = None
    default_timezone: str
    default_currency: str
    logo_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None
