"""Lead schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import ClientType, LeadStatus


class MessageResponse(BaseModel):
    message: str


class LeadCreate(BaseModel):
    lead_title: str = Field(..., min_length=1, max_length=255)
    platform_id: int | None = None
    contact_name: str = Field(..., min_length=1, max_length=150)
    contact_title: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = None
    quotation: Decimal | None = None
    expected_close_date: date | None = None
    assigned_employment_id: int | None = None
    status: LeadStatus = LeadStatus.NEW
    priority: str | None = Field(None, max_length=20)
    description: str | None = None
    chat_link: str | None = Field(None, max_length=500)
    client_id: int | None = None
    # Q12: project creation on WON is opt-in (default false).
    auto_create_project: bool = False
    client_type: ClientType = ClientType.COMPANY
    client_name: str | None = None


class LeadUpdate(BaseModel):
    lead_title: str | None = Field(None, min_length=1, max_length=255)
    platform_id: int | None = None
    contact_name: str | None = None
    contact_title: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = None
    quotation: Decimal | None = None
    expected_close_date: date | None = None
    assigned_employment_id: int | None = None
    priority: str | None = Field(None, max_length=20)
    description: str | None = None
    chat_link: str | None = Field(None, max_length=500)
    client_id: int | None = None
    auto_create_project: bool | None = None
    status: LeadStatus | None = None
    client_type: ClientType | None = None
    client_name: str | None = None


class LeadStatusChange(BaseModel):
    status: LeadStatus
    client_id: int | None = None
    client_type: ClientType | None = None
    client_name: str | None = None
    auto_create_project: bool | None = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_title: str
    platform_id: int | None
    contact_name: str
    contact_title: str | None = None
    email: str | None
    phone: str | None
    quotation: Decimal | None
    expected_close_date: date | None
    assigned_employment_id: int | None
    status: LeadStatus
    priority: str | None = None
    description: str | None
    chat_link: str | None = None
    client_id: int | None
    auto_create_project: bool
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
    platform_name: str | None = None
    assignee_name: str | None = None


class LeadDetailResponse(LeadResponse):
    """Extended lead detail (same fields V1)."""


class LeadWonResponse(BaseModel):
    lead: LeadResponse
    client_id: int
    project_id: int | None = None
