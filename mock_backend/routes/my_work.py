"""
My Work module routes — mirrors frontend /my-work/* API surface.
Data: store keys my_work_* (seeded from data.modules.my_work).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["my-work"])


def _paginate(items: list[Any], page: int = 1, page_size: int = 20) -> dict[str, Any]:
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 100))
    total = len(items)
    start = (page - 1) * page_size
    return {
        "items": items[start : start + page_size],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


def _working_days(from_s: str, to_s: str, half_day: bool, holiday_dates: set[str]) -> float:
    if not from_s or not to_s:
        return 0.5 if half_day else 0.0
    a = date.fromisoformat(from_s)
    b = date.fromisoformat(to_s)
    if b < a:
        return 0.0
    days = 0
    cur = a
    while cur <= b:
        if cur.weekday() < 5:
            iso = cur.isoformat()
            if iso not in holiday_dates:
                days += 1
        cur += timedelta(days=1)
    if half_day and days >= 1:
        return max(0.5, days - 0.5)
    return float(days)


def _holidays_list() -> list[dict[str, Any]]:
    items = get_obj("my_work_holidays") or []
    if isinstance(items, list) and items:
        return list(items)
    org = get_collection("holidays")
    return [
        {
            "date": h.get("date"),
            "name": h.get("name"),
            "holidayType": h.get("holiday_type") or h.get("holidayType") or "NATIONAL",
        }
        for h in org
        if h.get("date")
    ]


@router.get("/my-work/overview")
def overview():
    return {
        "user": get_obj("my_work_current_user") or {},
        "metrics": get_obj("my_work_metrics") or [],
        "todayAttendance": get_obj("my_work_today_attendance") or {},
        "weekHours": get_obj("my_work_week_hours") or [],
        "leaveBalances": get_obj("my_work_leave_balances") or [],
        "tasks": get_obj("my_work_tasks") or [],
        "notifications": get_obj("my_work_notifications") or [],
        "events": get_obj("my_work_events") or [],
        "quickActions": get_obj("my_work_quick_actions") or [],
    }


@router.get("/my-work/leave")
def list_leave(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
):
    items = list(get_obj("my_work_leave_requests") or [])
    if status and status != "All":
        items = [r for r in items if r.get("status") == status]
    if search:
        q = search.lower()
        items = [
            r
            for r in items
            if q in str(r.get("reason", "")).lower()
            or q in str(r.get("type", "")).lower()
            or q in str(r.get("id", "")).lower()
        ]
    return _paginate(items, page, pageSize)


@router.get("/my-work/leave/balances")
def leave_balances():
    return get_obj("my_work_leave_balances") or []


@router.get("/my-work/leave/types")
def leave_types():
    return get_obj("my_work_leave_types") or []


@router.get("/my-work/leave/apply-context")
def apply_leave_context():
    return {
        "holidays": _holidays_list(),
        "leaveTypes": get_obj("my_work_leave_types") or [],
        "balances": get_obj("my_work_leave_balances") or [],
    }


@router.post("/my-work/leave/calculate")
def calculate_leave(body: dict[str, Any] = Body(default={})):
    from_s = str(body.get("from") or "")
    to_s = str(body.get("to") or "")
    half = bool(body.get("halfDay"))
    leave_type = body.get("type")
    holidays = _holidays_list()
    holiday_dates = {h["date"] for h in holidays if h.get("date")}
    day_cost = _working_days(from_s, to_s, half, holiday_dates)
    balances = get_obj("my_work_leave_balances") or []
    bal = next((b for b in balances if b.get("type") == leave_type), None)
    remaining = bal.get("remaining") if bal else None
    estimated = None if remaining is None else max(0, float(remaining) - day_cost)
    in_range = [h for h in holidays if from_s and to_s and from_s <= h.get("date", "") <= to_s]
    return {
        "dayCost": day_cost,
        "balanceRemaining": remaining,
        "estimatedBalanceAfter": estimated,
        "holidaysInRange": in_range,
    }


@router.post("/my-work/leave")
def submit_leave(body: dict[str, Any] = Body(default={})):
    holidays = _holidays_list()
    holiday_dates = {h["date"] for h in holidays if h.get("date")}
    days = _working_days(
        str(body.get("from") or ""),
        str(body.get("to") or ""),
        bool(body.get("halfDay")),
        holiday_dates,
    )
    items = list(get_obj("my_work_leave_requests") or [])
    row = {
        "id": f"LV-{int(datetime.utcnow().timestamp() * 1000)}",
        "type": body.get("type"),
        "from": body.get("from"),
        "to": body.get("to"),
        "days": days,
        "reason": body.get("reason") or "",
        "status": "Pending",
        "appliedOn": date.today().isoformat(),
        "approver": "—",
        "halfDay": "start" if body.get("halfDay") else None,
    }
    items.insert(0, row)
    set_obj("my_work_leave_requests", items)
    return row


@router.get("/my-work/attendance")
def list_attendance(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
):
    items = list(get_obj("my_work_attendance") or [])
    if status and status != "All":
        items = [r for r in items if r.get("status") == status]
    if search:
        q = search.lower()
        items = [
            r
            for r in items
            if q in str(r.get("date", "")).lower()
            or q in str(r.get("status", "")).lower()
            or q in str(r.get("note", "")).lower()
        ]
    return _paginate(items, page, pageSize)


@router.get("/my-work/attendance/correction-candidates")
def correction_candidates():
    items = get_obj("my_work_attendance") or []
    return [
        r
        for r in items
        if r.get("status") in ("Half Day", "Absent") or r.get("note")
    ]


@router.get("/my-work/attendance/corrections")
def list_corrections(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
):
    items = list(get_obj("my_work_corrections") or [])
    if status and status != "All":
        items = [r for r in items if r.get("status") == status]
    if search:
        q = search.lower()
        items = [
            r
            for r in items
            if q in str(r.get("date", "")).lower()
            or q in str(r.get("reason", "")).lower()
            or q in str(r.get("originalStatus", "")).lower()
            or q in str(r.get("approver", "")).lower()
        ]
    return _paginate(items, page, pageSize)


@router.post("/my-work/attendance/corrections")
def submit_correction(body: dict[str, Any] = Body(default={})):
    items = list(get_obj("my_work_corrections") or [])
    row = {
        **body,
        "id": f"corr-{int(datetime.utcnow().timestamp() * 1000)}",
        "status": "Pending",
        "submittedOn": date.today().isoformat(),
    }
    items.insert(0, row)
    set_obj("my_work_corrections", items)
    return row


@router.get("/my-work/tasks")
def list_tasks(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
):
    items = list(get_obj("my_work_tasks") or [])
    if status and status != "All":
        items = [t for t in items if t.get("status") == status]
    if search:
        q = search.lower()
        items = [
            t
            for t in items
            if q in str(t.get("name", "")).lower() or q in str(t.get("project", "")).lower()
        ]
    return _paginate(items, page, pageSize)


@router.get("/my-work/approvals")
def list_approvals(
    status: Optional[str] = None,
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
):
    items = list(get_obj("my_work_approvals") or [])
    if status and status != "All":
        items = [a for a in items if a.get("status") == status]
    return _paginate(items, page, pageSize)


@router.get("/my-work/approvers")
def list_approvers():
    return get_obj("my_work_approvers") or []


@router.get("/my-work/bank-details")
def get_bank():
    return get_obj("my_work_bank_details") or {}


@router.put("/my-work/bank-details")
@router.patch("/my-work/bank-details")
def put_bank(body: dict[str, Any] = Body(default={})):
    current = dict(get_obj("my_work_bank_details") or {})
    current.update(body)
    set_obj("my_work_bank_details", current)
    return current


@router.get("/holidays")
def holidays_map():
    return {h["date"]: h["name"] for h in _holidays_list() if h.get("date")}
