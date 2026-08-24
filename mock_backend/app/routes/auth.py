"""Auth routes — login/logout/me/refresh. No real password checks."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app.services import store

router = APIRouter(prefix="/auth", tags=["auth"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("/login")
def login(body: dict):
    email = (body.get("email") or "").strip().lower()
    users = store.read_list("users.json")
    user = next((u for u in users if u.get("email", "").lower() == email), None)
    if not user:
        user = users[0] if users else {
            "id": 1,
            "email": email or "demo@bytevon.com",
            "name": "Demo User",
            "role": "Super Admin",
            "status": "ACTIVE",
        }
    if user.get("status") == "LOCKED":
        user["status"] = "ACTIVE"
        user["failed_attempt_count"] = 0
        user["locked_until"] = None
    user["last_login_at"] = _now()
    user["updated_at"] = _now()
    for i, u in enumerate(users):
        if u.get("id") == user.get("id"):
            users[i] = user
            break
    store.write("users.json", users)

    sessions = store.read_list("sessions.json")
    sid = store.next_id("next_session_id")
    session = {
        "id": sid,
        "user_id": user["id"],
        "refresh_token": f"mock-refresh-{sid}",
        "created_at": _now(),
        "revoked": False,
    }
    sessions.append(session)
    store.write("sessions.json", sessions)

    return {
        "access_token": f"mock-access-{user['id']}-{sid}",
        "refresh_token": session["refresh_token"],
        "token_type": "bearer",
        "expires_in": 600,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role"),
            "status": user.get("status"),
        },
    }


@router.post("/logout")
def logout(request: Request, body: dict | None = None):
    body = body or {}
    refresh = body.get("refresh_token")
    sessions = store.read_list("sessions.json")
    for s in sessions:
        if refresh and s.get("refresh_token") == refresh:
            s["revoked"] = True
        elif not refresh and s.get("user_id") == getattr(request.state, "mock_user_id", None):
            s["revoked"] = True
    store.write("sessions.json", sessions)
    return {"ok": True}


@router.post("/refresh")
def refresh(body: dict):
    token = body.get("refresh_token")
    sessions = store.read_list("sessions.json")
    session = next((s for s in sessions if s.get("refresh_token") == token and not s.get("revoked")), None)
    if not session:
        return {
            "access_token": "mock-access-guest",
            "refresh_token": token or "mock-refresh-guest",
            "token_type": "bearer",
            "expires_in": 600,
        }
    return {
        "access_token": f"mock-access-{session['user_id']}-{session['id']}",
        "refresh_token": session["refresh_token"],
        "token_type": "bearer",
        "expires_in": 600,
    }


@router.get("/me")
def me(request: Request):
    user = getattr(request.state, "mock_user", None)
    if not user:
        users = store.read_list("users.json")
        user = users[0] if users else {"id": 1, "email": "demo@bytevon.com", "name": "Demo"}
    return {"user": store.clone(user)}


@router.post("/change-password")
def change_password(request: Request, body: dict):
    return {"ok": True, "message": "Password changed (mock)"}


@router.post("/forgot-password")
def forgot_password(body: dict):
    return {"ok": True, "message": "Reset email sent (mock)", "email": body.get("email")}
