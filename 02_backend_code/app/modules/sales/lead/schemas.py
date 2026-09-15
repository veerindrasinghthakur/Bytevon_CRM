"""Lead schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import ClientType, LeadStatus


class MessageResponse(BaseModel):
    message: str


class LeadCreate(BaseModel):
    lead_title: str = Field(..., min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: str = Field(..., min_length=1, max_length=150)
    contact_title: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    expected_close_date: Optional[date] = None
    assigned_employment_id: Optional[int] = None
    status: LeadStatus = LeadStatus.NEW
    priority: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    chat_link: Optional[str] = Field(None, max_length=500)
    client_id: Optional[int] = None
    auto_create_project: bool = True
    client_type: ClientType = ClientType.COMPANY
    client_name: Optional[str] = None


class LeadUpdate(BaseModel):
    lead_title: Optional[str] = Field(None, min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    expected_close_date: Optional[date] = None
    assigned_employment_id: Optional[int] = None
    priority: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    chat_link: Optional[str] = Field(None, max_length=500)
    client_id: Optional[int] = None
    auto_create_project: Optional[bool] = None
    status: Optional[LeadStatus] = None
    client_type: Optional[ClientType] = None
    client_name: Optional[str] = None


class LeadStatusChange(BaseModel):
    status: LeadStatus
    client_id: Optional[int] = None
    client_type: Optional[ClientType] = None
    client_name: Optional[str] = None
    auto_create_project: Optional[bool] = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_title: str
    platform_id: Optional[int]
    contact_name: str
    contact_title: Optional[str] = None
    email: Optional[str]
    phone: Optional[str]
    quotation: Optional[Decimal]
    expected_close_date: Optional[date]
    assigned_employment_id: Optional[int]
    status: LeadStatus
    priority: Optional[str] = None
    description: Optional[str]
    chat_link: Optional[str] = None
    client_id: Optional[int]
    auto_create_project: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class LeadDetailResponse(LeadResponse):
    """Extended lead detail (same fields V1)."""


class LeadWonResponse(BaseModel):
    lead: LeadResponse
    client_id: int
    project_id: Optional[int] = None
