"""Project HTTP routes — includes domain routers under /projects."""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.project.project.routes import router as project_router
from app.modules.project.task.routes import router as task_router
from app.modules.project.team.routes import router as team_router

router = APIRouter(prefix="/projects", tags=["Projects"])

router.include_router(team_router)
router.include_router(task_router)
router.include_router(project_router)
