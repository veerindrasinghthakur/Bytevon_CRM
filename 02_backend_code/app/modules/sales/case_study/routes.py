"""Case study routes — GET/POST /case-studies."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import require_permission
from app.modules.sales.case_study.schemas import CaseStudyCreate
from app.modules.sales.dependencies import CaseStudyServiceDep

router = APIRouter(prefix="/case-studies", tags=["Sales Case Studies"])


@router.get("", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def list_case_studies(
    service: CaseStudyServiceDep,
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return await service.list(search=search, page=page, page_size=pageSize)


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("lead", "CREATE", "ORGANIZATION"))])
async def create_case_study(
    body: CaseStudyCreate,
    service: CaseStudyServiceDep,
) -> dict[str, Any]:
    # V1: accept body, return echo (no persistence yet)
    return {
        "id": "cs-temp",
        "title": body.title,
        "summary": body.summary,
        "status": "draft",
    }
