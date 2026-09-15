"""Payroll run routes."""
from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.payroll.dependencies import PayrollRunServiceDep
from app.modules.payroll.payroll_run.schemas import MessageResponse, RunPayrollBody

router = APIRouter(prefix="/payroll", tags=["Payroll — Run"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.get("/run/checks")
async def run_checks(service: PayrollRunServiceDep) -> list[dict[str, Any]]:
    return await service.checks()


@router.get("/run/preview")
async def run_preview(
    service: PayrollRunServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    return await service.preview(year=year, month=month)


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
async def run_payroll(
    body: RunPayrollBody,
    service: PayrollRunServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.run(body, actor_employment_id=actor)
