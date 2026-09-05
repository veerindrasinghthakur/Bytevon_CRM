"""
Sales ORM models.

Tables: clients, client_contacts, platforms, leads

Locked Lead WON:
- Client created only on WON (reuse if lead.client_id set).
- Optional ProjectPublicService.create_from_lead after client resolve.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    ArchiveMixin,
    Base,
    ChangedByMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import ClientType, LeadStatus


class Client(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "clients"

    client_type: Mapped[ClientType] = mapped_column(nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    contacts: Mapped[List["ClientContact"]] = relationship(
        "ClientContact",
        back_populates="client",
        cascade="all, delete-orphan",
    )


class ClientContact(Base, IdentityMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "client_contacts"

    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clients.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    designation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    client: Mapped["Client"] = relationship("Client", back_populates="contacts")


class Platform(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "platforms"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Lead(Base, IdentityMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "leads"

    lead_title: Mapped[str] = mapped_column(String(255), nullable=False)
    platform_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("platforms.id"), nullable=True
    )
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    quotation: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    assigned_employment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=True, index=True
    )
    status: Mapped[LeadStatus] = mapped_column(
        nullable=False, default=LeadStatus.NEW
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Set on WON (or earlier if linking existing client)
    client_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("clients.id"), nullable=True, index=True
    )
    # Controls auto project creation on WON
    auto_create_project: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
