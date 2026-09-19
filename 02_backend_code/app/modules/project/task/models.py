"""Task and TaskTimeEntry ORM models."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import TaskPriority, TaskStatus

if TYPE_CHECKING:
    from app.modules.project.project.models import Project


class Task(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "tasks"

    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee_employment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=True, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        nullable=False, default=TaskPriority.MEDIUM
    )
    status: Mapped[TaskStatus] = mapped_column(
        nullable=False, default=TaskStatus.TODO
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    commit_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="tasks")
    time_entries: Mapped[list[TaskTimeEntry]] = relationship(
        "TaskTimeEntry", back_populates="task", cascade="all, delete-orphan"
    )


class TaskTimeEntry(Base, IdentityMixin, CreatedAtMixin):
    """Immutable daily time record. UNIQUE(task_id, employment_id, work_date)."""

    __tablename__ = "task_time_entries"
    __table_args__ = (
        UniqueConstraint(
            "task_id",
            "employment_id",
            "work_date",
            name="uq_task_time_entries_task_emp_date",
        ),
    )

    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False, index=True
    )
    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    task: Mapped[Task] = relationship("Task", back_populates="time_entries")
