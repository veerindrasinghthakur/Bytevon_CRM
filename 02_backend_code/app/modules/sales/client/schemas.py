"""Client + contact schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import ClientType


class MessageResponse(BaseModel):
    message: str


class ClientCreate(BaseModel):
    client_type: ClientType
    client_name: str = Field(..., min_length=1, max_length=255)
    website: str | None = None
    industry: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None


class ClientUpdate(BaseModel):
    client_name: str | None = Field(None, min_length=1, max_length=255)
    website: str | None = None
    industry: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_type: ClientType
    client_name: str
    website: str | None
    industry: str | None
    country: str | None
    state: str | None
    city: str | None
    address: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


class ClientDetailResponse(ClientResponse):
    """Extended client detail (same fields V1)."""


class ContactCreate(BaseModel):
    client_id: int
    name: str = Field(..., min_length=1, max_length=150)
    designation: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


# Alias used by older routes
ClientContactCreate = ContactCreate


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    name: str
    designation: str | None
    email: str | None
    phone: str | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


ClientContactResponse = ContactResponse
