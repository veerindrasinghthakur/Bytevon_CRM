"""WorkingWeek ORM model (versioned)."""
from __future__ import annotations

from sqlalchemy import Integer, SmallInteger, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, CreatedAtMixin, EffectiveDatingMixin, IdentityMixin


class WorkingWeek(Base, IdentityMixin, EffectiveDatingMixin, CreatedAtMixin):
    __tablename__ = "working_weeks"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    working_days_of_week: Mapped[list[int]] = mapped_column(ARRAY(SmallInteger), nullable=False)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
