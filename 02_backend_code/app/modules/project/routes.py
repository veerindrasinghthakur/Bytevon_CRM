"""Project HTTP routes — domain routers under /projects."""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.project.document.routes import router as document_router
from app.modules.project.note.routes import router as note_router
from app.modules.project.project.routes import router as project_router
from app.modules.project.task.routes import router as task_router
from app.modules.project.team.routes import router as team_router

router = APIRouter(prefix="/projects", tags=["Projects"])

# Static paths first: /{project_id} would otherwise shadow /notes, /links, etc.
router.include_router(team_router)
router.include_router(task_router)
router.include_router(note_router)
router.include_router(document_router)
router.include_router(project_router)
