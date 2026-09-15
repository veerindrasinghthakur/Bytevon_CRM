"""Client + contact schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import ClientType


class MessageResponse(BaseModel):
    message: str


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


class ClientDetailResponse(ClientResponse):
    """Extended client detail (same fields V1)."""


class ContactCreate(BaseModel):
    client_id: int
    name: str = Field(..., min_length=1, max_length=150)
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


# Alias used by older routes
ClientContactCreate = ContactCreate


class ContactResponse(BaseModel):
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


ClientContactResponse = ContactResponse
