"""
Employment ORM models.

Tables:
  positions, employments, employment_state_history, employment_assignments

Schema source: Complete_Final_Schema.md §3 Employment.
persons lives in Authentication module; referenced by Integer FK.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import (
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    ArchiveMixin,
    Base,
    CreatedAtMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import EmploymentState, EmploymentType, WorkMode

# ---------------------------------------------------------------------------
# positions 🟨
# ---------------------------------------------------------------------------

class Position(Base, IdentityMixin, ArchiveMixin, TimestampMixin):
    __tablename__ = "positions"

    name: Mapped[str] = mapped_column(String(150), nullable=False)


# ---------------------------------------------------------------------------
# employments 🟨
# ---------------------------------------------------------------------------

class Employment(Base, IdentityMixin, TimestampMixin):
    """
    One employment period for a person.
    Rehire = new row. current_state is maintained as a denormalized cache;
    source of truth for lifecycle is employment_state_history.
    """

    __tablename__ = "employments"
    __table_args__ = (
        UniqueConstraint("employee_code", name="uq_employments_employee_code"),
    )

    person_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("persons.id"), nullable=False, index=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(nullable=False)
    current_state: Mapped[EmploymentState] = mapped_column(nullable=False)
    joining_date: Mapped[date] = mapped_column(Date, nullable=False)
    changed_by: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="Employment ID or SYSTEM_EMPLOYMENT_ID"
    )

    state_history: Mapped[list[EmploymentStateHistory]] = relationship(
        "EmploymentStateHistory",
        back_populates="employment",
        order_by="EmploymentStateHistory.effective_date",
        cascade="all, delete-orphan",
    )
    assignments: Mapped[list[EmploymentAssignment]] = relationship(
        "EmploymentAssignment",
        back_populates="employment",
        order_by="EmploymentAssignment.effective_from",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# employment_state_history 🟩 (append-only)
# ---------------------------------------------------------------------------

class EmploymentStateHistory(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "employment_state_history"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    previous_state: Mapped[EmploymentState | None] = mapped_column(nullable=True)
    new_state: Mapped[EmploymentState] = mapped_column(nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    employment: Mapped[Employment] = relationship(
        "Employment", back_populates="state_history"
    )


# ---------------------------------------------------------------------------
# employment_assignments 🟩 (append-only / versioned by effective dates)
# ---------------------------------------------------------------------------

class EmploymentAssignment(Base, IdentityMixin, CreatedAtMixin):
    """
    Assignment history. Current assignment = row where effective_to IS NULL.
    Promotions / transfers / relocations create a new row and close the previous.
    """

    __tablename__ = "employment_assignments"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    department_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("departments.id"), nullable=True
    )
    position_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("positions.id"), nullable=True
    )
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("locations.id"), nullable=True
    )
    shift_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("shifts.id"), nullable=True
    )
    work_mode: Mapped[WorkMode] = mapped_column(nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    change_reason: Mapped[str] = mapped_column(String(100), nullable=False)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    employment: Mapped[Employment] = relationship(
        "Employment", back_populates="assignments"
    )
