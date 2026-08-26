"""Organization module routes — locations, shifts, holidays, departments, org profile."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_obj

router = APIRouter(tags=["organization"])


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _now_disp() -> str:
    return datetime.utcnow().strftime("%b %d, %Y %H:%M")


@router.get("/admin/settings/organization-profile")
def get_org_profile():
    return get_obj("organization_profile") or {}


@router.patch("/admin/settings/organization-profile")
@router.put("/admin/settings/organization-profile")
def put_org_profile(body: dict[str, Any] = Body(default={})):
    current = dict(get_obj("organization_profile") or {})
    current.update(body)
    set_obj("organization_profile", current)
    return current


@router.get("/organization/settings")
def org_settings():
    return get_obj("organization_profile") or {}


@router.get("/organization/offices")
@router.get("/admin/offices/options")
def head_options():
    out = []
    for o in get_collection("offices"):
        out.append(
            {
                "id": str(o.get("id")),
                "name": o.get("name"),
                "country": o.get("country") or "",
                "city": o.get("city") or "",
                "timezone": o.get("timezone") or "",
                "currency": o.get("currency") or "",
                "fiscal": o.get("fiscal") or "",
                "address": o.get("address") or "",
                "postal": o.get("postal") or "",
            }
        )
    return out


@router.get("/organization/locations")
def list_locations(includeArchived: bool = Query(default=False)):
    items = list(get_collection("locations"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}


@router.get("/organization/locations/{location_id}")
def get_location(location_id: int):
    return next((x for x in get_collection("locations") if x.get("id") == location_id), None)


@router.get("/organization/shifts")
def list_shifts(includeArchived: bool = Query(default=False)):
    items = list(get_collection("shifts"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}


@router.get("/organization/shifts/{shift_id}")
def get_shift(shift_id: int):
    return next((x for x in get_collection("shifts") if x.get("id") == shift_id), None)


@router.get("/organization/working-weeks")
def list_working_weeks():
    items = get_collection("working_weeks")
    return {"items": items, "total": len(items)}


@router.get("/organization/holiday-calendars")
def list_holiday_calendars():
    items = get_collection("holiday_calendars") or []
    return {"items": items, "total": len(items)}


@router.get("/organization/holidays")
def list_holidays(calendarId: Optional[int] = None):
    items = get_collection("holidays") or []
    if calendarId is not None:
        items = [h for h in items if h.get("holiday_calendar_id") == calendarId]
    return {"items": items, "total": len(items)}


@router.get("/organization/positions")
def list_positions(includeArchived: bool = Query(default=False)):
    items = list(get_collection("positions"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}


@router.get("/organization/departments")
def list_departments_wrapped():
    items = get_collection("departments")
    return {"items": items, "total": len(items)}


@router.get("/admin/leave/types")
def leave_types():
    return get_collection("leave_types")


@router.get("/admin/leave/policies")
def leave_policies():
    return get_collection("leave_policies")


@router.get("/admin/leave/ledger")
def leave_ledger(employeeId: Optional[str] = None):
    items = get_collection("leave_ledger")
    return items
