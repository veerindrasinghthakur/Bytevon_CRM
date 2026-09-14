"""Lead schemas."""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.db.enums import ClientType, LeadStatus

class MessageResponse(BaseModel):
    message: str

class LeadCreate(BaseModel):
    lead_title: str = Field(..., min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: str = Field(..., min_length=1, max_length=150)
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    assigned_employment_id: Optional[int] = None
    status: LeadStatus = LeadStatus.NEW
    priority: Optional[str] = None
    description: Optional[str] = None
    chat_link: Optional[str] = None
    client_id: Optional[int] = None
    auto_create_project: bool = True
    client_type: ClientType = ClientType.COMPANY
    client_name: Optional[str] = None

class LeadUpdate(BaseModel):
    lead_title: Optional[str] = Field(None, min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: Optional[str] = Field(None, min_length=1, max_length=150)
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    assigned_employment_id: Optional[int] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    chat_link: Optional[str] = None
    client_id: Optional[int] = None

class LeadStatusChange(BaseModel):
    status: LeadStatus
    reason: Optional[str] = None

class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lead_title: str
    platform_id: Optional[int] = None
    contact_name: str
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    assigned_employment_id: Optional[int] = None
    status: LeadStatus
    priority: Optional[str] = None
    description: Optional[str] = None
    chat_link: Optional[str] = None
    client_id: Optional[int] = None
    auto_create_project: bool = True
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None

class LeadWonResponse(BaseModel):
    lead: LeadResponse
    client_id: int
    project_id: Optional[int] = None
