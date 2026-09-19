"""Organization settings schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrganizationSettingsUpdate(BaseModel):
    company_name: str | None = Field(None, min_length=1, max_length=255)
    head_office_location_id: int | None = None
    default_timezone: str | None = None
    default_currency: str | None = None
    logo_reference: str | None = None

class OrganizationSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_name: str
    head_office_location_id: int | None = None
    default_timezone: str
    default_currency: str
    logo_reference: str | None = None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None = None
