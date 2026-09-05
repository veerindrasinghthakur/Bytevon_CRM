"""
Pydantic v2 schemas for Sales module.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import ClientType, LeadStatus


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Client
# ===========================================================================

class ClientCreate(BaseModel):
    client_type: ClientType
    client_name: str = Field(..., min_length=1, max_length=255)
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None


class ClientUpdate(BaseModel):
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_type: ClientType
    client_name: str
    website: Optional[str]
    industry: Optional[str]
    country: Optional[str]
    state: Optional[str]
    city: Optional[str]
    address: Optional[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Client Contact
# ===========================================================================

class ClientContactCreate(BaseModel):
    client_id: int
    name: str = Field(..., min_length=1, max_length=150)
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ClientContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    name: str
    designation: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Platform
# ===========================================================================

class PlatformCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None


class PlatformUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None


class PlatformResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Lead
# ===========================================================================

class LeadCreate(BaseModel):
    lead_title: str = Field(..., min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: str = Field(..., min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    expected_close_date: Optional[date] = None
    assigned_employment_id: Optional[int] = None
    status: LeadStatus = LeadStatus.NEW
    description: Optional[str] = None
    client_id: Optional[int] = None  # link existing client early if known
    auto_create_project: bool = True
    # Used when creating client on WON if no client_id
    client_type: ClientType = ClientType.COMPANY
    client_name: Optional[str] = None  # defaults to contact_name / lead_title


class LeadUpdate(BaseModel):
    lead_title: Optional[str] = Field(None, min_length=1, max_length=255)
    platform_id: Optional[int] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    expected_close_date: Optional[date] = None
    assigned_employment_id: Optional[int] = None
    description: Optional[str] = None
    client_id: Optional[int] = None
    auto_create_project: Optional[bool] = None
    client_type: Optional[ClientType] = None
    client_name: Optional[str] = None


class LeadStatusChange(BaseModel):
    status: LeadStatus
    # Optional overrides for WON client creation
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
    email: Optional[str]
    phone: Optional[str]
    quotation: Optional[Decimal]
    expected_close_date: Optional[date]
    assigned_employment_id: Optional[int]
    status: LeadStatus
    description: Optional[str]
    client_id: Optional[int]
    auto_create_project: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class LeadWonResponse(BaseModel):
    lead: LeadResponse
    client: ClientResponse
    project_id: Optional[int] = None
    project_created: bool = False
