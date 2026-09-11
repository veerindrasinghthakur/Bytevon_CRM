"""
Payroll HTTP routes.

IMPORTANT: static paths (/kpis, /employees, /period, …) MUST be declared
before /{payroll_id} or FastAPI will try to parse "employees" as int → 422.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status

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


def _period_now() -> dict[str, Any]:
    today = date.today()
    return {
        "year": today.year,
        "month": today.month,
        "label": today.strftime("%B %Y"),
        "status": "OPEN",
    }


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
    total_net = sum(float(getattr(r, "net_pay", 0) or 0) for r in rows)
    total_gross = sum(float(getattr(r, "gross_pay", 0) or 0) for r in rows)
    paid = [r for r in rows if str(getattr(r, "status", "")).upper() == "PAID"]
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
    """UI employee payroll list derived from monthly payroll rows."""
    today = date.today()
    y = year or today.year
    m = month or today.month
    rows = await service.list_payrolls(year=y, month=m, limit=500)
    items: list[dict[str, Any]] = []
    for r in rows:
        emp_id = getattr(r, "employment_id", None)
        items.append(
            {
                "id": str(getattr(r, "id", emp_id)),
                "employmentId": emp_id,
                "name": f"Employee #{emp_id}",
                "code": f"EMP-{emp_id}",
                "department": "—",
                "status": str(getattr(r, "status", "DRAFT")),
                "gross": float(getattr(r, "gross_pay", 0) or 0),
                "earnings": float(getattr(r, "gross_pay", 0) or 0),
                "deductions": float(getattr(r, "total_deductions", 0) or 0),
                "net": float(getattr(r, "net_pay", 0) or 0),
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
    metrics = {
        "totalGross": sum(e["gross"] for e in items),
        "totalNet": sum(e["net"] for e in items),
        "count": total,
    }
    return {
        "items": page_items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "metrics": metrics,
    }


@router.get("/activity")
async def payroll_activity(
    service: PayrollServiceDep,
    limit: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    rows = await service.list_payrolls(limit=limit)
    out: list[dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": str(getattr(r, "id", "")),
                "title": f"Payroll {getattr(r, 'year', '')}-{getattr(r, 'month', ''):02d}"
                if getattr(r, "month", None)
                else f"Payroll #{getattr(r, 'id', '')}",
                "status": str(getattr(r, "status", "")),
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
        "totalGross": sum(float(getattr(r, "gross_pay", 0) or 0) for r in rows),
        "totalNet": sum(float(getattr(r, "net_pay", 0) or 0) for r in rows),
        "totalDeductions": sum(
            float(getattr(r, "total_deductions", 0) or 0) for r in rows
        ),
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
        status_val = str(getattr(r, "status", "")).upper()
        if status_val != "PAID":
            continue
        emp_id = getattr(r, "employment_id", None)
        out.append(
            {
                "id": str(getattr(r, "id", "")),
                "period": f"{getattr(r, 'year', '')}-{getattr(r, 'month', 0):02d}",
                "employeeId": str(emp_id) if emp_id is not None else "",
                "paidOn": str(getattr(r, "paid_at", getattr(r, "updated_at", ""))),
                "gross": float(getattr(r, "gross_pay", 0) or 0),
                "net": float(getattr(r, "net_pay", 0) or 0),
                "ref": getattr(r, "payment_reference", None) or f"TRX-{getattr(r, 'id', '')}",
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
            "gross": float(getattr(r, "gross_pay", 0) or 0),
            "earnings": float(getattr(r, "gross_pay", 0) or 0),
            "deductions": float(getattr(r, "total_deductions", 0) or 0),
            "net": float(getattr(r, "net_pay", 0) or 0),
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
    body: PayrollCalculateRequest,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    await service.calculate_payroll(body, actor_employment_id=actor)
    return MessageResponse(message="Payroll calculation started")


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
