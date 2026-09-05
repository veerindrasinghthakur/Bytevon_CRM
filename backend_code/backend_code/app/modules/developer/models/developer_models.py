"""
Developer / Projects ORM models.

Tables: teams, team_members, projects, tasks, task_time_entries

Lean module: no boards, sprints, subtasks, comments, checklists.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)


class Team(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    team_head_employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    members: Mapped[List["TeamMember"]] = relationship(
        "TeamMember", back_populates="team", cascade="all, delete-orphan"
    )


class TeamMember(Base, IdentityMixin):
    """Membership history. Active = left_at IS NULL."""

    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint(
            "team_id", "employment_id", name="uq_team_members_team_employment"
        ),
    )

    team_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("teams.id"), nullable=False, index=True
    )
    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    team_role: Mapped[str] = mapped_column(String(100), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    left_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    team: Mapped["Team"] = relationship("Team", back_populates="members")


class Project(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "projects"
    __table_args__ = (
        UniqueConstraint("lead_id", name="uq_projects_lead_id"),
    )

    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clients.id"), nullable=False, index=True
    )
    lead_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("leads.id"), nullable=True, index=True
    )
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assignment_type: Mapped[ProjectAssignmentType] = mapped_column(nullable=False)
    assigned_to_id: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="employment_id or team_id per assignment_type"
    )
    repository_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(nullable=False)
    phase: Mapped[ProjectPhase] = mapped_column(nullable=False)
    created_from: Mapped[ProjectSource] = mapped_column(nullable=False)
    planned_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="project", cascade="all, delete-orphan"
    )


class Task(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "tasks"

    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assignee_employment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=True, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        nullable=False, default=TaskPriority.MEDIUM
    )
    status: Mapped[TaskStatus] = mapped_column(
        nullable=False, default=TaskStatus.TODO
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    commit_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="tasks")
    time_entries: Mapped[List["TaskTimeEntry"]] = relationship(
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
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    task: Mapped["Task"] = relationship("Task", back_populates="time_entries")
