"""Compatibility — prefer domain services."""

from app.modules.project.domains.project.service import (
    ProjectPublicService,
    ProjectService,
)

__all__ = ["ProjectService", "ProjectPublicService"]
