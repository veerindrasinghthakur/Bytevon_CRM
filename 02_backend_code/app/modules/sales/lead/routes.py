"""Lead routes — prefix /leads."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import LeadStatus
from app.modules.sales.dependencies import LeadServiceDep
from app.modules.sales.lead.schemas import (
    LeadCreate,
    LeadResponse,
    LeadStatusChange,
    LeadUpdate,
)

router = APIRouter(prefix="/leads", tags=["Sales Leads"])


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    service: LeadServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("lead", "CREATE", "ORGANIZATION"))],
) -> LeadResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("", response_model=list[LeadResponse], dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def list_leads(
    service: LeadServiceDep,
    status_filter: LeadStatus | None = Query(None, alias="status"),
    assigned_employment_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeadResponse]:
    return await service.list(
        status=status_filter,
        assigned_employment_id=assigned_employment_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{lead_id}", response_model=LeadResponse, dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def get_lead(lead_id: int, service: LeadServiceDep) -> LeadResponse:
    return await service.get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    body: LeadUpdate,
    service: LeadServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("lead", "UPDATE", "ORGANIZATION"))],
) -> LeadResponse:
    return await service.update(lead_id, body, actor_employment_id=auth.employment_id)


@router.post("/{lead_id}/status")
async def change_lead_status(
    lead_id: int,
    body: LeadStatusChange,
    service: LeadServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("lead", "UPDATE", "ORGANIZATION"))],
):
    return await service.change_status(lead_id, body, actor_employment_id=auth.employment_id)
