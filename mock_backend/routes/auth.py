"""Auth routes — demo only. Accepts any token; login returns fixed-shape session."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Body, HTTPException, Request

from store import get_collection, set_collection

router = APIRouter(tags=["auth"])


def _now() -> datetime:
    return datetime.utcnow()


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _fake_tokens(login_id: int = 1) -> dict[str, Any]:
    return {
        "accessToken": f"mock-access-{login_id}",
        "refreshToken": f"mock-refresh-{login_id}",
        "tokenType": "Bearer",
        "expiresIn": 600,
    }


def _user_payload(auth_row: dict, login_row: dict | None = None) -> dict[str, Any]:
    return {
        "id": auth_row.get("login_id") or 1,
        "email": auth_row["email"],
        "name": auth_row.get("name") or auth_row["email"],
        "employmentId": auth_row.get("employment_id") or 1,
        "roles": auth_row.get("roles") or ["Employee"],
        "status": (login_row or {}).get("status") or "ACTIVE",
    }


@router.post("/auth/login")
def login(body: dict[str, Any] = Body(default={})):
    email = (body.get("email") or body.get("username") or "").strip().lower()
    password = body.get("password") or ""

    auth_users = get_collection("auth_users")
    matched = None
    for u in auth_users:
        if u["email"].lower() == email:
            matched = u
            break

    if not email and not password:
        matched = auth_users[0] if auth_users else {
            "email": "admin@bytevon.local",
            "login_id": 1,
            "name": "Admin User",
            "employment_id": 1,
            "roles": ["Senior Administrator"],
        }
    elif matched and password and matched.get("password") and password != matched["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    elif not matched and email:
        matched = {
            "email": email or "demo@bytevon.local",
            "login_id": 1,
            "name": email.split("@")[0] if email else "Demo",
            "employment_id": 1,
            "roles": ["Employee"],
        }

    if matched is None:
        matched = auth_users[0]

    login_users = get_collection("login_users")
    login_row = next((l for l in login_users if l["id"] == matched.get("login_id")), None)

    tokens = _fake_tokens(matched.get("login_id") or 1)
    user = _user_payload(matched, login_row)

    audits = get_collection("audit_logs")
    audits.insert(0, {
        "id": f"AUD-L-{int(_now().timestamp())}",
        "action": "Login success",
        "actor": user["name"],
        "actorInitials": "".join(p[0] for p in user["name"].split()[:2]).upper() or "AU",
        "target": user["email"],
        "module": "Auth",
        "timestamp": _now().strftime("%b %d, %Y %H:%M"),
        "timestamp_iso": _iso(_now()),
        "ip": "127.0.0.1",
    })
    set_collection("audit_logs", audits)

    return {
        "user": user,
        "tokens": tokens,
        "session": {
            "id": 1,
            "loginId": user["id"],
            "expiresAt": _iso(_now() + timedelta(hours=8)),
        },
    }


@router.post("/auth/refresh")
def refresh(body: dict[str, Any] = Body(default={})):
    refresh_token = body.get("refreshToken") or body.get("refresh_token") or "mock-refresh-1"
    login_id = 1
    if isinstance(refresh_token, str) and refresh_token.rsplit("-", 1)[-1].isdigit():
        login_id = int(refresh_token.rsplit("-", 1)[-1])
    return {
        "tokens": _fake_tokens(login_id),
        "session": {
            "id": 1,
            "loginId": login_id,
            "expiresAt": _iso(_now() + timedelta(hours=8)),
        },
    }


@router.post("/auth/logout")
def logout(request: Request, body: dict[str, Any] = Body(default={})):
    return {"ok": True}


@router.post("/auth/change-password")
def change_password(body: dict[str, Any] = Body(default={})):
    return {"ok": True}


@router.post("/auth/forgot-password")
def forgot_password(body: dict[str, Any] = Body(default={})):
    return {"ok": True, "message": "If the email exists, a reset link was sent (mock)."}


@router.post("/auth/reset-password")
def reset_password(body: dict[str, Any] = Body(default={})):
    return {"ok": True}


@router.get("/auth/sessions")
def list_sessions():
    return get_collection("sessions")


@router.post("/auth/sessions/{session_id}/revoke")
def revoke_session(session_id: int):
    sessions = get_collection("sessions")
    for s in sessions:
        if s.get("id") == session_id:
            s["status"] = "REVOKED"
    set_collection("sessions", sessions)
    return {"ok": True}


@router.post("/auth/sessions/revoke-all")
def revoke_all():
    sessions = get_collection("sessions")
    for s in sessions:
        s["status"] = "REVOKED"
        s["current"] = False
    set_collection("sessions", sessions)
    return {"ok": True}


@router.get("/auth/me")
def me(request: Request):
    auth_users = get_collection("auth_users")
    u = auth_users[0] if auth_users else {
        "email": "admin@bytevon.local",
        "login_id": 1,
        "name": "Admin User",
        "employment_id": 1,
        "roles": ["Senior Administrator"],
    }
    return _user_payload(u)
