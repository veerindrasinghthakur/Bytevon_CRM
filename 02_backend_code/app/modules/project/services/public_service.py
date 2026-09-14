"""Compatibility shim — prefer app.modules.project.domains.project.service."""

from app.modules.project.domains.project.service import (
    ProjectPublicService,
    ProjectService,
)

__all__ = ["ProjectService", "ProjectPublicService"]
