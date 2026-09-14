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
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None

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
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None
