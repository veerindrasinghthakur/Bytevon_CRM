"""OrganizationSettings ORM model (singleton)."""
from __future__ import annotations
from typing import Optional
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, ChangedByMixin, IdentityMixin, TimestampMixin

class OrganizationSettings(Base, IdentityMixin, TimestampMixin, ChangedByMixin):
    """Exactly one row. Represents the organization."""
    __tablename__ = "organization_settings"
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    head_office_location_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("locations.id"), nullable=True)
    default_timezone: Mapped[str] = mapped_column(String(100), nullable=False)
    default_currency: Mapped[str] = mapped_column(String(20), nullable=False)
    logo_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    head_office = relationship("Location")
