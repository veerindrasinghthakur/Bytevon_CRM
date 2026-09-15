"""Sent routes."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.modules.notifications.dependencies import SentServiceDep
from app.modules.notifications.sent.schemas import SentListResponse

router = APIRouter(prefix="/notifications", tags=["Notifications — Sent"])


@router.get("/sent", response_model=SentListResponse)
async def list_sent(
    service: SentServiceDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
) -> SentListResponse:
    return await service.list_sent(page=page, page_size=pageSize)
