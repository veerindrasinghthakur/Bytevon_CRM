"""Department ORM model."""
from __future__ import annotations
from typing import Optional
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.base import ArchiveMixin, Base, CreatedAtMixin, IdentityMixin

class Department(Base, IdentityMixin, ArchiveMixin, CreatedAtMixin):
    __tablename__ = "departments"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_head_employment_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="FK employments.id (soft reference)"
    )
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Employment ID or SYSTEM_EMPLOYMENT_ID"
    )
