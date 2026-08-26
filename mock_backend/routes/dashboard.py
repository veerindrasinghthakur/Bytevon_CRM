"""Dashboard + admin hub metrics routes."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from store import get_collection, get_obj

router = APIRouter(tags=["dashboard"])


def _now_disp() -> str:
    return datetime.utcnow().strftime("%b %d, %Y %H:%M")


@router.get("/admin/metrics/hub")
def metrics_hub():
    m = get_obj("metrics") or {}
    users = get_collection("admin_users")
    roles = get_collection("roles")
    return {
        **m,
        "users": len(users),
        "roles": len(roles),
        "activeSessions": m.get("activeSessions", 12),
        "auditEventsToday": m.get("auditEventsToday", 20),
        "configHealth": m.get("configHealth", "Good"),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
        "activeUsers": sum(1 for u in users if u.get("status") == "Active"),
        "offices": len(get_collection("offices")),
        "departments": len(get_collection("departments")),
        "employees": len(get_collection("employments")),
    }


@router.get("/admin/metrics/roles")
def metrics_roles():
    roles = get_collection("roles")
    users = get_collection("admin_users")
    return {
        "totalRoles": len(roles),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "activeUsers": sum(1 for u in users if u.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
    }


@router.get("/admin/metrics/leave")
def metrics_leave():
    return {
        "leaveTypes": len(get_collection("leave_types")),
        "pendingRequests": 7,
        "approvedThisMonth": 23,
        "avgBalanceDays": 12,
    }


@router.get("/admin/metrics/attendance")
def metrics_attendance():
    return {"presentToday": 42, "lateToday": 3, "onLeaveToday": 5, "remoteCheckIns": 8}


@router.get("/dashboard/executive")
def dashboard_executive():
    return {
        "kpis": {
            "employees": len(get_collection("employments")),
            "users": len(get_collection("admin_users")),
            "roles": len(get_collection("roles")),
            "activeProjects": 8,
            "openLeads": 14,
            "pendingApprovals": 5,
        },
        "recentActivities": [
            {
                "id": 1,
                "title": "Role updated",
                "module": "Admin",
                "time": _now_disp(),
                "status": "COMPLETED",
                "icon": "edit_note",
            }
        ],
        "alerts": [],
    }
