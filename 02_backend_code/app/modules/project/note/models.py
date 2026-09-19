"""Note ORM model — polymorphic LEAD | TASK | CLIENT."""
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, IdentityMixin, TimestampMixin
from app.core.db.enums import NoteReferenceType


class Note(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "notes"

    reference_type: Mapped[NoteReferenceType] = mapped_column(nullable=False, index=True)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
