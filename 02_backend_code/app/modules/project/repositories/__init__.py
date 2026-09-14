"""Compatibility — prefer domain repositories."""

from app.modules.project.domains.project.repository import ProjectRepository
from app.modules.project.domains.task.repository import TaskRepository
from app.modules.project.domains.team.repository import TeamRepository

__all__ = ["ProjectRepository", "TaskRepository", "TeamRepository"]
