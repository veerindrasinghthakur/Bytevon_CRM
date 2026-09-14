"""Compatibility — prefer domain schemas."""

from app.modules.project.schemas.schemas import (
    MessageResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
    TimeEntryCreate,
    TimeEntryResponse,
)

__all__ = [
    "MessageResponse",
    "TeamCreate",
    "TeamUpdate",
    "TeamResponse",
    "TeamMemberAdd",
    "TeamMemberResponse",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectDetailResponse",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TimeEntryCreate",
    "TimeEntryResponse",
]
