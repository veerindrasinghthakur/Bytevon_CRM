"""
Development payroll seeder — real rows in the DB (not mocks).

Run after bootstrap + test-data seeds:
    cd 02_backend_code
    python -m scripts.seed_payroll_dev

Covers every employment that is missing a salary structure or a current-month
payroll, gives employment 18 a department/role assignment, and walks a few
September 2026 payrolls through the workflow so the monthly table shows real
ids in every status (CALCULATED / APPROVED / PAID).

Idempotent: existing salaries / payrolls are left untouched.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.db.enums import SalaryItemType, WorkMode
from app.modules.payroll.monthly_payroll.schemas import (
    PayrollCalculateRequest,
    PayrollPaymentRequest,
)
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.payroll.salary_management.schemas import (
    EmployeeSalaryCreate,
    SalaryItemInput,
)
from app.modules.payroll.salary_management.service import SalaryManagementService
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import EmploymentAssignment, Position
from app.modules.admin.location.models import Location
from app.modules.workforce.shift.models import Shift

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed_payroll_dev")

YEAR, MONTH = 2026, 9

# employment_id -> (gross, pf_deduction)
SALARIES: dict[int, tuple[str, str]] = {
    12: ("2500.00", "150.00"),
    17: ("3000.00", "200.00"),
    18: ("2200.00", "120.00"),
    20: ("2800.00", "180.00"),
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        salary_svc = SalaryManagementService(session)
        payroll_svc = MonthlyPayrollService(session)

        # 1. Salary structures for employments that have none.
        for emp_id, (gross, pf) in SALARIES.items():
            existing = await salary_svc.list_salaries(emp_id)
            if existing:
                log.info("salary exists for employment %s — skip", emp_id)
                continue
            await salary_svc.create_salary(
                EmployeeSalaryCreate(
                    employment_id=emp_id,
                    effective_from=date(2026, 4, 1),
                    gross_salary=Decimal(gross),
                    items=[
                        SalaryItemInput(name="Salary", type=SalaryItemType.EARNING, amount=Decimal(gross)),
                        SalaryItemInput(name="PF", type=SalaryItemType.DEDUCTION, amount=Decimal(pf)),
                    ],
                )
            )
            log.info("salary created for employment %s (gross %s)", emp_id, gross)

        # 2. Department/role assignment for employment 18 (shows "—" otherwise).
        asg = (
            await session.execute(
                select(EmploymentAssignment).where(
                    EmploymentAssignment.employment_id == 18,
                    EmploymentAssignment.effective_to.is_(None),
                )
            )
        ).scalar_one_or_none()
        if asg is None:
            dept = (await session.execute(select(Department).where(Department.name == "HR"))).scalar_one()
            pos = (await session.execute(select(Position).where(Position.name == "HR Specialist"))).scalar_one()
            loc = (await session.execute(select(Location).order_by(Location.id).limit(1))).scalar_one()
            shift = (await session.execute(select(Shift).order_by(Shift.id).limit(1))).scalar_one()
            session.add(
                EmploymentAssignment(
                    employment_id=18,
                    department_id=dept.id,
                    position_id=pos.id,
                    location_id=loc.id,
                    shift_id=shift.id,
                    work_mode=WorkMode.OFFICE,
                    effective_from=date.today(),
                    effective_to=None,
                    change_reason="Dev seed assignment",
                )
            )
            await session.flush()
            log.info("assignment created for employment 18 (HR / HR Specialist)")

        # 3. September 2026 payrolls for employments missing one.
        for emp_id in (12, 17, 18, 20):
            existing = await payroll_svc._repo.get_payroll(emp_id, YEAR, MONTH)
            if existing:
                log.info("payroll exists for employment %s %s-%s — skip", emp_id, YEAR, MONTH)
                continue
            p = await payroll_svc.calculate_payroll(
                PayrollCalculateRequest(employment_id=emp_id, year=YEAR, month=MONTH)
            )
            log.info("payroll %s calculated for employment %s (net %s)", p.id, emp_id, p.net_salary)

        # 4. Walk the workflow: approve #19, pay #17 with a reference.
        # NOTE: direct SQL (not approve_payroll/mark_paid services) — those
        # helpers lazy-load ORM collections, which the seed's plain async
        # session cannot resolve outside a request greenlet. Business rules
        # verified inline: CALCULATED->APPROVED, APPROVED->PAID only.
        from sqlalchemy import text as _text

        r = await session.execute(
            _text("SELECT status FROM monthly_payroll WHERE id = 19")
        )
        if r.scalar() == "CALCULATED":
            await session.execute(
                _text("UPDATE monthly_payroll SET status = 'APPROVED', changed_by = 1 WHERE id = 19")
            )
            log.info("payroll 19 approved")
        r = await session.execute(
            _text("SELECT status FROM monthly_payroll WHERE id = 17")
        )
        if r.scalar() == "APPROVED":
            await session.execute(
                _text(
                    "UPDATE monthly_payroll SET status = 'PAID', payment_method = 'BANK_TRANSFER', "
                    "payment_reference = 'TRX-SEP26-001', payment_date = '2026-09-25', "
                    "changed_by = 1 WHERE id = 17"
                )
            )
            log.info("payroll 17 paid (TRX-SEP26-001)")
        await session.commit()

        # 5. Real September attendance for employment 16 (payroll 18's owner)
        # + rebuilt monthly summary + recalculated payroll so monthly-info,
        # payable/LOP and net are all consistent with the same source data.
        await seed_september_attendance(session, payroll_svc)

        log.info("seed_payroll_dev complete")


async def seed_september_attendance(session, payroll_svc) -> None:
    from datetime import datetime, timezone
    from sqlalchemy import text as _text

    from app.core.db.enums import AttendanceStatus
    from app.modules.workforce.attendance.models import AttendanceBreak, AttendanceDay
    from app.modules.workforce.attendance.service import AttendanceService

    emp_id, year, month = 16, 2026, 9
    existing = (
        await session.execute(
            select(AttendanceDay.id).where(
                AttendanceDay.employment_id == emp_id,
                AttendanceDay.attendance_date >= date(year, month, 1),
                AttendanceDay.attendance_date < date(year, month + 1, 1),
            )
        )
    ).first()
    if existing is None:
        # Sept 2026: weekday presents (8h), 2 absents, 1 half (4h),
        # 1 on-leave, weekends as week-off.
        overrides = {
            9: (AttendanceStatus.ABSENT, None),
            10: (AttendanceStatus.ABSENT, None),
            17: (AttendanceStatus.HALF_DAY, Decimal("4.00")),
            22: (AttendanceStatus.ON_LEAVE, None),
        }
        for day in range(1, 31):
            d = date(year, month, day)
            if d.weekday() >= 5:
                status, hours = AttendanceStatus.WEEK_OFF, None
            else:
                status, hours = overrides.get(day, (AttendanceStatus.PRESENT, Decimal("8.00")))
            session.add(
                AttendanceDay(
                    employment_id=emp_id,
                    attendance_date=d,
                    status=status,
                    working_hours=hours,
                )
            )
        await session.flush()
        # Two lunch breaks (60 min each) on real days.
        for day, hour in ((3, 13), (15, 13)):
            day_row = (
                await session.execute(
                    select(AttendanceDay).where(
                        AttendanceDay.employment_id == emp_id,
                        AttendanceDay.attendance_date == date(year, month, day),
                    )
                )
            ).scalar_one()
            start = datetime(year, month, day, hour, 0, tzinfo=timezone.utc)
            session.add(
                AttendanceBreak(
                    attendance_day_id=day_row.id,
                    break_start=start,
                    break_end=datetime(year, month, day, hour + 1, 0, tzinfo=timezone.utc),
                    duration_minutes=60,
                )
            )
        await session.flush()
        log.info("september attendance days + breaks seeded for employment 16")

    # Rebuild the monthly summary with direct SQL (the service's response
    # validation lazy-loads ORM state that a plain script session cannot
    # resolve; aggregates here mirror rebuild_monthly_summary exactly).
    from sqlalchemy import text as _sql

    agg = (
        await session.execute(
            _sql(
                "SELECT status, COUNT(*), COALESCE(SUM(working_hours), 0) "
                "FROM attendance_days WHERE employment_id = :e "
                "AND attendance_date >= :s AND attendance_date < :x GROUP BY status"
            ),
            {"e": emp_id, "s": date(year, month, 1), "x": date(year, month + 1, 1)},
        )
    ).all()
    present = absent = half = holiday = week_off = on_leave = Decimal("0")
    hours = Decimal("0")
    for status, count, total in agg:
        c, t = Decimal(str(count)), Decimal(str(total or 0))
        if status == "PRESENT":
            present += c
        elif status == "ABSENT":
            absent += c
        elif status == "HALF_DAY":
            half += Decimal("0.5") * c
            present += Decimal("0.5") * c
        elif status == "HOLIDAY":
            holiday += c
        elif status == "WEEK_OFF":
            week_off += c
        elif status == "ON_LEAVE":
            on_leave += c
        hours += t
    brk = (
        await session.execute(
            _sql(
                "SELECT COALESCE(SUM(b.duration_minutes), 0) FROM attendance_breaks b "
                "JOIN attendance_days d ON d.id = b.attendance_day_id "
                "WHERE d.employment_id = :e AND d.attendance_date >= :s AND d.attendance_date < :x"
            ),
            {"e": emp_id, "s": date(year, month, 1), "x": date(year, month + 1, 1)},
        )
    ).scalar() or 0
    expected = present + absent + half
    pct = (present / expected * 100).quantize(Decimal("0.01")) if expected > 0 else None
    await session.execute(
        _sql(
            "INSERT INTO monthly_attendance_summaries "
            "(employment_id, year, month, present_days, absent_days, half_days, holiday_days, "
            "week_off_days, on_leave_days, working_hours, break_minutes, attendance_percentage, "
            "rebuilt_at, is_locked) "
            "VALUES (:e, :y, :m, :p, :a, :h, :ho, :w, :o, :wh, :b, :pct, now(), false) "
            "ON CONFLICT (employment_id, year, month) DO UPDATE SET present_days = :p, "
            "absent_days = :a, half_days = :h, holiday_days = :ho, week_off_days = :w, "
            "on_leave_days = :o, working_hours = :wh, break_minutes = :b, "
            "attendance_percentage = :pct, rebuilt_at = now()"
        ),
        {"e": emp_id, "y": year, "m": month, "p": present, "a": absent, "h": half,
         "ho": holiday, "w": week_off, "o": on_leave, "wh": hours,
         "b": Decimal(str(brk)), "pct": pct},
    )
    await session.flush()
    log.info(
        "summary rebuilt: present=%s absent=%s half=%s leave=%s hours=%s break_min=%s",
        present, absent, half, on_leave, hours, brk,
    )

    # Recalculate payroll 18 (CALCULATED) so payable/LOP/net follow attendance.
    r = await session.execute(_text("SELECT status FROM monthly_payroll WHERE id = 18"))
    if r.scalar() == "CALCULATED":
        try:
            p = await payroll_svc.calculate_payroll(
                PayrollCalculateRequest(employment_id=emp_id, year=year, month=month)
            )
            log.info("payroll 18 recalculated (net %s, payable %s, lop %s)", p.net_salary, p.payable_days, p.lop_days)
        except Exception as e:
            log.warning("payroll 18 recalc skipped: %s", e)
            await session.rollback()
            return
        await session.commit()
        # Payroll 18 intentionally stays CALCULATED so the workflow can be
        # walked from the monthly detail page.


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception:
        log.exception("Seed failed")
        raise


if __name__ == "__main__":
    main()
