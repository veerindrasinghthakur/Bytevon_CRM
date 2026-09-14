"""
Project HTTP routes (module package: project).

Main router includes domain routers directly.
Router prefix: /projects

Frontend expects:
  GET  /api/v1/projects           → list projects
  GET  /api/v1/projects/{id}      → project detail + metrics (single call)
  GET  /api/v1/projects/teams     → list teams
  GET  /api/v1/projects/tasks     → list tasks (project_id | project_name)
"""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.project.domains.project.routes import router as project_router
from app.modules.project.domains.task.routes import router as task_router
from app.modules.project.domains.team.routes import router as team_router

router = APIRouter(prefix="/projects", tags=["Projects"])

# Static domain paths first (teams, tasks), then project id routes
router.include_router(team_router)
router.include_router(task_router)
router.include_router(project_router)
