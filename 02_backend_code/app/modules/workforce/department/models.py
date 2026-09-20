"""Department ORM model — canonical owner is Workforce.

Table: departments (shared). Soft-delete uses is_archived (canonical).
DELETE API sets is_archived=true; rows are never hard-deleted.
"""
from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import ArchiveMixin, Base, CreatedAtMixin, IdentityMixin


class Department(Base, IdentityMixin, ArchiveMixin, CreatedAtMixin):
    __tablename__ = "departments"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_head_employment_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="FK employments.id (soft reference)"
    )
    created_by: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="Employment ID or SYSTEM_EMPLOYMENT_ID"
    )
