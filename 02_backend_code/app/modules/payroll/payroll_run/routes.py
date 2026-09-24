"""Payroll run routes."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.payroll.dependencies import PayrollRunServiceDep
from app.modules.payroll.payroll_run.schemas import MessageResponse, RunPayrollBody

router = APIRouter(prefix="/payroll", tags=["Payroll — Run"])


@router.get("/run/checks", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def run_checks(service: PayrollRunServiceDep) -> list[dict[str, Any]]:
    return await service.checks()


@router.get("/run/preview", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def run_preview(
    service: PayrollRunServiceDep,
    year: int | None = Query(None),
    month: int | None = Query(None),
) -> dict[str, Any]:
    return await service.preview(year=year, month=month)


@router.post("/run", status_code=status.HTTP_200_OK)
async def run_payroll(
    body: RunPayrollBody,
    service: PayrollRunServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "CREATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.run(body, actor_employment_id=auth.employment_id)
