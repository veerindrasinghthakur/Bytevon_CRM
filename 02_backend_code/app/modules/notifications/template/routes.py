"""Template routes."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.notifications.dependencies import TemplateServiceDep
from app.modules.notifications.template.schemas import (
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
)

router = APIRouter(prefix="/notifications", tags=["Notifications — Templates"])


@router.post(
    "/templates",
    response_model=NotificationTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: NotificationTemplateCreate,
    service: TemplateServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "ORGANIZATION"))],
) -> NotificationTemplateResponse:
    return await service.create_template(body, actor_employment_id=auth.employment_id)


@router.get("/templates", response_model=list[NotificationTemplateResponse], dependencies=[Depends(require_permission("notification", "VIEW", "ORGANIZATION"))])
async def list_templates(
    service: TemplateServiceDep,
    active_only: bool = Query(False),
) -> list[NotificationTemplateResponse]:
    return await service.list_templates(active_only=active_only)


@router.get("/templates/{template_id}", response_model=NotificationTemplateResponse, dependencies=[Depends(require_permission("notification", "VIEW", "ORGANIZATION"))])
async def get_template(
    template_id: int,
    service: TemplateServiceDep,
) -> NotificationTemplateResponse:
    return await service.get_template(template_id)


@router.patch(
    "/templates/{template_id}",
    response_model=NotificationTemplateResponse,
)
async def update_template(
    template_id: int,
    body: NotificationTemplateUpdate,
    service: TemplateServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "ORGANIZATION"))],
) -> NotificationTemplateResponse:
    return await service.update_template(
        template_id, body, actor_employment_id=auth.employment_id
    )


@router.get("/triggers", dependencies=[Depends(require_permission("notification", "VIEW", "ORGANIZATION"))])
async def list_triggers(service: TemplateServiceDep) -> list[dict[str, Any]]:
    templates = await service.list_templates(active_only=False)
    out: list[dict[str, Any]] = []
    for t in templates:
        out.append(
            {
                "id": str(t.id),
                "code": getattr(t, "code", None) or str(t.id),
                "name": getattr(t, "code", str(t.id)),
                "description": "",
                "channels": ["IN_APP", "EMAIL"],
                "active": getattr(t, "is_active", True),
            }
        )
    return out
