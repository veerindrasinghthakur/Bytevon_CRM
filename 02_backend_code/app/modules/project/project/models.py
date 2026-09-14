"""Project ORM model."""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, IdentityMixin, TimestampMixin
from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
)

if TYPE_CHECKING:
    from app.modules.project.task.models import Task


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
