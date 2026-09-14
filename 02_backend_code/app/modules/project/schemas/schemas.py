"""Compatibility shim — prefer domain schemas."""

from app.modules.project.domains.project.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.project.domains.task.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TimeEntryCreate,
    TimeEntryResponse,
)
from app.modules.project.domains.team.schemas import (
    MessageResponse,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
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
