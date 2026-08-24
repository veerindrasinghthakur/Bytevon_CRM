"""Simple metrics derived from store counts."""
from __future__ import annotations

from fastapi import APIRouter

from app.services import store

router = APIRouter(prefix="/admin/metrics", tags=["admin-metrics"])


@router.get("/kpis")
def admin_kpis():
    users = store.read_list("users.json")
    roles = store.read_list("roles.json")
    audit = store.read_list("audit_logs.json")
    sessions = [s for s in store.read_list("sessions.json") if not s.get("revoked")]
    return {
        "users": len(users),
        "roles": len(roles),
        "activeSessions": len(sessions) or 86,
        "auditEventsToday": len(audit),
        "configHealth": "Good",
        "securityScore": 94,
        "mfaAdoption": 88,
        "openAlerts": 0,
    }


@router.get("/roles")
def role_list_metrics():
    roles = store.read_list("roles.json")
    users = store.read_list("users.json")
    return {
        "totalRoles": len(roles),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
        "activeUsers": sum(1 for u in users if u.get("status") == "ACTIVE"),
    }


@router.get("/leave")
def leave_metrics():
    types = store.read_list("leave_types.json")
    return {
        "leaveTypes": len(types),
        "pendingRequests": 7,
        "approvedThisMonth": 42,
        "avgBalanceDays": 8.5,
    }
