"""
Sales ORM models.

Tables: clients, client_contacts, platforms, leads

Locked Lead WON:
- Client created only on WON (reuse if lead.client_id set).
- Optional ProjectPublicService.create_from_lead after client resolve.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

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
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(150), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    founded: Mapped[str | None] = mapped_column(String(100), nullable=True)
    chat_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    contacts: Mapped[list[ClientContact]] = relationship(
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
    designation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    client: Mapped[Client] = relationship("Client", back_populates="contacts")


class Platform(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "platforms"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Lead(Base, IdentityMixin, TimestampMixin, ChangedByMixin, ArchiveMixin):
    __tablename__ = "leads"

    lead_title: Mapped[str] = mapped_column(String(255), nullable=False)
    platform_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("platforms.id"), nullable=True
    )
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    quotation: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    assigned_employment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=True, index=True
    )
    status: Mapped[LeadStatus] = mapped_column(
        nullable=False, default=LeadStatus.NEW
    )
    # UI priority: Critical | High | Medium | Low
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    chat_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Set on WON (or earlier if linking existing client)
    client_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("clients.id"), nullable=True, index=True
    )
    # Controls auto project creation on WON (Q12: opt-in, default false)
    auto_create_project: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
