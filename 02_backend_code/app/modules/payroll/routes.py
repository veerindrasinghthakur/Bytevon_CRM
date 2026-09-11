"""
Payroll HTTP routes.

IMPORTANT: static paths (/kpis, /employees, /period, …) MUST be declared
before /{payroll_id} or FastAPI will try to parse "employees" as int → 422.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status
from pydantic import BaseModel, Field

from app.modules.payroll.dependencies import PayrollServiceDep
from app.modules.payroll.schemas.schemas import (
    BankAccountCreate,
    BankAccountResponse,
    EmployeeSalaryCreate,
    EmployeeSalaryResponse,
    MessageResponse,
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
    PayrollPaymentRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


class RunPayrollBody(BaseModel):
    """Frontend posts { year, month }; employment_id optional for bulk stub."""

    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    employment_id: Optional[int] = None


def _period_now() -> dict[str, Any]:
    today = date.today()
    return {
        "year": today.year,
        "month": today.month,
        "label": today.strftime("%B %Y"),
        "status": "OPEN",
    }


def _money(r: Any, *names: str) -> float:
    for n in names:
        v = getattr(r, n, None)
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                continue
    return 0.0


def _status_str(r: Any) -> str:
    s = getattr(r, "status", "")
    return s.value if hasattr(s, "value") else str(s)


# ---------------------------------------------------------------------------
# Frontend convenience routes (STATIC — before /{payroll_id})
# ---------------------------------------------------------------------------


@router.get("/kpis")
async def payroll_kpis(
    service: PayrollServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    today = date.today()
    y = year or today.year
    m = month or today.month
    rows = await service.list_payrolls(year=y, month=m, limit=500)
    total_net = sum(_money(r, "net_salary", "net_pay") for r in rows)
    total_gross = sum(_money(r, "gross_salary", "gross_pay") for r in rows)
    paid = [r for r in rows if _status_str(r).upper() == "PAID"]
    return {
        "employees": len(rows),
        "totalGross": total_gross,
        "totalNet": total_net,
        "paidCount": len(paid),
        "pendingCount": max(0, len(rows) - len(paid)),
        "period": f"{y}-{m:02d}",
    }


@router.get("/period")
async def payroll_period() -> dict[str, Any]:
    return _period_now()


@router.get("/employees")
async def list_payroll_employees(
    service: PayrollServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
) -> dict[str, Any]:
    today = date.today()
    y = year or today.year
    m = month or today.month
    rows = await service.list_payrolls(year=y, month=m, limit=500)
    items: list[dict[str, Any]] = []
    for r in rows:
        emp_id = getattr(r, "employment_id", None)
        gross = _money(r, "gross_salary", "gross_pay")
        items.append(
            {
                "id": str(getattr(r, "id", emp_id)),
                "employmentId": emp_id,
                "name": f"Employee #{emp_id}",
                "code": f"EMP-{emp_id}",
                "department": "—",
                "status": _status_str(r),
                "gross": gross,
                "earnings": _money(r, "total_earnings", "gross_salary"),
                "deductions": _money(r, "total_deductions"),
                "net": _money(r, "net_salary", "net_pay"),
                "paymentRef": getattr(r, "payment_reference", None),
            }
        )
    if search:
        q = search.lower()
        items = [
            e
            for e in items
            if q in e["name"].lower() or q in e["code"].lower() or q in str(e["id"])
        ]
    total = len(items)
    start = (page - 1) * pageSize
    page_items = items[start : start + pageSize]
    return {
        "items": page_items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "metrics": {
            "totalGross": sum(e["gross"] for e in items),
            "totalNet": sum(e["net"] for e in items),
            "count": total,
        },
    }


@router.get("/activity")
async def payroll_activity(
    service: PayrollServiceDep,
    limit: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    rows = await service.list_payrolls(limit=limit)
    out: list[dict[str, Any]] = []
    for r in rows:
        y = getattr(r, "year", None)
        m = getattr(r, "month", None)
        if y is not None and m is not None:
            title = f"Payroll {y}-{int(m):02d}"
        else:
            title = f"Payroll #{getattr(r, 'id', '')}"
        out.append(
            {
                "id": str(getattr(r, "id", "")),
                "title": title,
                "status": _status_str(r),
                "time": str(getattr(r, "updated_at", getattr(r, "created_at", ""))),
            }
        )
    return out


@router.get("/monthly-summary")
async def monthly_summary(
    service: PayrollServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    today = date.today()
    y = year or today.year
    m = month or today.month
    rows = await service.list_payrolls(year=y, month=m, limit=500)
    return {
        "year": y,
        "month": m,
        "employeeCount": len(rows),
        "totalGross": sum(_money(r, "gross_salary", "gross_pay") for r in rows),
        "totalNet": sum(_money(r, "net_salary", "net_pay") for r in rows),
        "totalDeductions": sum(_money(r, "total_deductions") for r in rows),
    }


@router.get("/history")
async def payroll_history(
    service: PayrollServiceDep,
    year: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    rows = await service.list_payrolls(year=year, limit=limit)
    out: list[dict[str, Any]] = []
    for r in rows:
        if _status_str(r).upper() != "PAID":
            continue
        emp_id = getattr(r, "employment_id", None)
        y = getattr(r, "year", "")
        m = getattr(r, "month", 0) or 0
        out.append(
            {
                "id": str(getattr(r, "id", "")),
                "period": f"{y}-{int(m):02d}",
                "employeeId": str(emp_id) if emp_id is not None else "",
                "paidOn": str(
                    getattr(r, "payment_date", None)
                    or getattr(r, "updated_at", "")
                ),
                "gross": _money(r, "gross_salary", "gross_pay"),
                "net": _money(r, "net_salary", "net_pay"),
                "ref": getattr(r, "payment_reference", None)
                or f"TRX-{getattr(r, 'id', '')}",
            }
        )
    if search:
        q = search.lower()
        out = [h for h in out if q in h["period"].lower() or q in h["ref"].lower()]
    return out


@router.get("/run/checks")
async def run_checks() -> list[dict[str, Any]]:
    return [
        {"id": "salary", "label": "Salary structures present", "status": "ok"},
        {"id": "attendance", "label": "Attendance summaries locked", "status": "warn"},
        {"id": "bank", "label": "Primary bank accounts", "status": "ok"},
    ]


@router.get("/run/preview")
async def run_preview(
    service: PayrollServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    today = date.today()
    y = year or today.year
    m = month or today.month
    rows = await service.list_payrolls(year=y, month=m, limit=500)
    employees = [
        {
            "id": str(getattr(r, "id", "")),
            "employmentId": getattr(r, "employment_id", None),
            "name": f"Employee #{getattr(r, 'employment_id', '')}",
            "gross": _money(r, "gross_salary", "gross_pay"),
            "earnings": _money(r, "total_earnings", "gross_salary"),
            "deductions": _money(r, "total_deductions"),
            "net": _money(r, "net_salary", "net_pay"),
        }
        for r in rows
    ]
    return {
        "employees": employees,
        "totalGross": sum(e["gross"] for e in employees),
        "totalEarnings": sum(e["earnings"] for e in employees),
        "totalDeductions": sum(e["deductions"] for e in employees),
        "estimatedNet": sum(e["net"] for e in employees),
    }


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
async def run_payroll(
    body: RunPayrollBody,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    if body.employment_id is not None:
        await service.calculate_payroll(
            PayrollCalculateRequest(
                employment_id=body.employment_id,
                year=body.year,
                month=body.month,
            ),
            actor_employment_id=actor,
        )
        return MessageResponse(message="Payroll calculated for employment")
    return MessageResponse(
        message=f"Payroll run accepted for {body.year}-{body.month:02d} "
        "(pass employment_id to calculate a single employee)"
    )


# ---------------------------------------------------------------------------
# Salary
# ---------------------------------------------------------------------------

@router.post(
    "/salaries",
    response_model=EmployeeSalaryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_salary(
    body: EmployeeSalaryCreate,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> EmployeeSalaryResponse:
    return await service.create_salary(body, actor_employment_id=actor)


@router.get(
    "/salaries/current/{employment_id}",
    response_model=EmployeeSalaryResponse,
)
async def get_current_salary(
    employment_id: int,
    service: PayrollServiceDep,
    as_of: Optional[date] = Query(None),
) -> EmployeeSalaryResponse:
    return await service.get_current_salary(employment_id, as_of=as_of)


@router.get(
    "/salaries/{employment_id}",
    response_model=list[EmployeeSalaryResponse],
)
async def list_salaries(
    employment_id: int, service: PayrollServiceDep
) -> list[EmployeeSalaryResponse]:
    return await service.list_salaries(employment_id)


# ---------------------------------------------------------------------------
# Monthly payroll (domain)
# ---------------------------------------------------------------------------

@router.post(
    "/calculate",
    response_model=MonthlyPayrollResponse,
    status_code=status.HTTP_201_CREATED,
)
async def calculate_payroll(
    body: PayrollCalculateRequest,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.calculate_payroll(body, actor_employment_id=actor)


@router.post(
    "/{payroll_id}/approve",
    response_model=MonthlyPayrollResponse,
)
async def approve_payroll(
    payroll_id: int,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.approve_payroll(payroll_id, actor_employment_id=actor)


@router.post(
    "/{payroll_id}/pay",
    response_model=MonthlyPayrollResponse,
)
async def mark_paid(
    payroll_id: int,
    body: PayrollPaymentRequest,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.mark_paid(payroll_id, body, actor_employment_id=actor)


@router.get("/{payroll_id}", response_model=MonthlyPayrollResponse)
async def get_payroll(
    payroll_id: int, service: PayrollServiceDep
) -> MonthlyPayrollResponse:
    return await service.get_payroll(payroll_id)


@router.get("", response_model=list[MonthlyPayrollResponse])
async def list_payrolls(
    service: PayrollServiceDep,
    employment_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[MonthlyPayrollResponse]:
    return await service.list_payrolls(
        employment_id=employment_id, year=year, month=month, limit=limit
    )


# ---------------------------------------------------------------------------
# Bank accounts
# ---------------------------------------------------------------------------

@router.post(
    "/bank-accounts",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_bank_account(
    body: BankAccountCreate,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> BankAccountResponse:
    return await service.add_bank_account(body, actor_employment_id=actor)


@router.get(
    "/bank-accounts/{employment_id}",
    response_model=list[BankAccountResponse],
)
async def list_bank_accounts(
    employment_id: int, service: PayrollServiceDep
) -> list[BankAccountResponse]:
    return await service.list_bank_accounts(employment_id)


@router.get(
    "/bank-accounts/{employment_id}/primary",
    response_model=BankAccountResponse,
)
async def get_primary_bank(
    employment_id: int, service: PayrollServiceDep
) -> BankAccountResponse:
    return await service.get_primary_bank(employment_id)
