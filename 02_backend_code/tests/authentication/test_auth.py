"""Phase 2 authentication scenarios (TASK-020..029, AUTH_SCENARIO_COUNT=14)."""
from __future__ import annotations

from jose import jwt
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.auth.models import Login, Session
from tests.conftest import TEST_PASSWORD


def _decode_claims(token: str) -> dict:
    # Signature verified implicitly by app usage; decode payload for assertions.
    return jwt.get_unverified_claims(token)


def _login(client, email: str, password: str):
    return client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )


def test_020_valid_login_and_jwt_employment_id(client, factory):
    """Valid login returns 200; JWT + response carry employment_id (SEC-001)."""
    actor = factory.actor("auth")
    resp = _login(client, actor["email"], TEST_PASSWORD)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["login_id"] == actor["login_id"]
    assert body["person_id"] == actor["person_id"]
    assert body["employment_id"] == actor["employment_id"]
    claims = _decode_claims(body["tokens"]["access_token"])
    assert claims["type"] == "access"
    assert claims["login_id"] == actor["login_id"]
    assert claims["employment_id"] == actor["employment_id"]


def test_021_invalid_password_rejected(client, factory):
    actor = factory.actor("auth")
    resp = _login(client, actor["email"], "Wrongpass123!")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_credentials"


def test_022_unknown_email_rejected(client):
    resp = _login(client, "nobody-at-all@example.com", "Wrongpass123!")
    assert resp.status_code == 401


def test_023_inactive_account_rejected(client, factory):
    actor = factory.actor("auth")

    async def _deactivate():
        async with AsyncSessionLocal() as session:
            login = (
                await session.execute(
                    select(Login).where(Login.id == actor["login_id"])
                )
            ).scalar_one()
            login.is_active = False
            await session.commit()

    client.portal.call(_deactivate)
    resp = _login(client, actor["email"], TEST_PASSWORD)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "account_inactive"


def test_024_locked_account_rejected(client, factory):
    actor = factory.actor("auth")
    for _ in range(5):
        resp = _login(client, actor["email"], "Wrongpass123!")
        assert resp.status_code == 401
    locked = _login(client, actor["email"], "Wrongpass123!")
    assert locked.status_code == 401
    assert locked.json()["error"]["code"] == "account_locked"
    correct_while_locked = _login(client, actor["email"], TEST_PASSWORD)
    assert correct_while_locked.status_code == 401
    assert correct_while_locked.json()["error"]["code"] == "account_locked"


def test_025_refresh_valid_pair(client, factory):
    actor = factory.actor("auth")
    first = _login(client, actor["email"], TEST_PASSWORD).json()
    resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first["tokens"]["refresh_token"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"] != first["tokens"]["access_token"]
    claims = _decode_claims(body["access_token"])
    assert claims["employment_id"] == actor["employment_id"]


def test_026_refresh_revoked_session_rejected(client, factory):
    actor = factory.actor("auth")
    first = _login(client, actor["email"], TEST_PASSWORD).json()

    async def _sessions():
        async with AsyncSessionLocal() as session:
            rows = (
                await session.execute(
                    select(Session).where(Session.login_id == actor["login_id"])
                )
            ).scalars().all()
            return [r.id for r in rows]

    session_ids = client.portal.call(_sessions)
    assert session_ids
    first_session_id = int(_decode_claims(first["tokens"]["refresh_token"])["jti"])
    assert first_session_id in session_ids
    me = _login(client, actor["email"], TEST_PASSWORD).json()
    me_headers = {
        "Authorization": f"Bearer {me['tokens']['access_token']}",
        "X-Login-Id": str(actor["login_id"]),
    }
    out = client.post(
        "/api/v1/auth/logout",
        params={"session_id": first_session_id},
        headers=me_headers,
    )
    assert out.status_code == 200, out.text
    resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first["tokens"]["refresh_token"]},
    )
    assert resp.status_code == 401


def test_027_refresh_malformed_rejected(client):
    resp = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "not-a-jwt"}
    )
    assert resp.status_code == 401


def test_028_logout_single_session(client, factory):
    actor = factory.actor("auth")
    first = _login(client, actor["email"], TEST_PASSWORD).json()
    second = _login(client, actor["email"], TEST_PASSWORD).json()

    async def _sessions():
        async with AsyncSessionLocal() as session:
            return (
                await session.execute(
                    select(Session).where(Session.login_id == actor["login_id"])
                )
            ).scalars().all()

    rows = client.portal.call(_sessions)
    assert len(rows) >= 2
    first_session_id = int(_decode_claims(first["tokens"]["refresh_token"])["jti"])
    headers = {
        "Authorization": f"Bearer {second['tokens']['access_token']}",
        "X-Login-Id": str(actor["login_id"]),
    }
    out = client.post(
        "/api/v1/auth/logout", params={"session_id": first_session_id}, headers=headers
    )
    assert out.status_code == 200, out.text
    # Revoked session's refresh fails; the other session still works.
    bad = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first["tokens"]["refresh_token"]},
    )
    assert bad.status_code == 401
    good = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": second["tokens"]["refresh_token"]},
    )
    assert good.status_code == 200, good.text


def test_029_logout_all_sessions(client, factory):
    actor = factory.actor("auth")
    first = _login(client, actor["email"], TEST_PASSWORD).json()
    second = _login(client, actor["email"], TEST_PASSWORD).json()
    headers = {
        "Authorization": f"Bearer {second['tokens']['access_token']}",
        "X-Login-Id": str(actor["login_id"]),
    }
    out = client.post(
        "/api/v1/auth/logout", params={"revoke_all": True}, headers=headers
    )
    assert out.status_code == 200, out.text
    for tokens in (first["tokens"], second["tokens"]):
        bad = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert bad.status_code == 401


def test_030_change_password_valid(client, factory):
    actor = factory.actor("auth")
    tokens = _login(client, actor["email"], TEST_PASSWORD).json()["tokens"]
    headers = {
        "Authorization": f"Bearer {tokens['access_token']}",
        "X-Login-Id": str(actor["login_id"]),
    }
    resp = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": TEST_PASSWORD,
            "new_password": "Newpass456!",
            "revoke_all_sessions": True,
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    assert _login(client, actor["email"], TEST_PASSWORD).status_code == 401
    assert _login(client, actor["email"], "Newpass456!").status_code == 200


def test_031_change_password_wrong_current(client, factory):
    actor = factory.actor("auth")
    tokens = _login(client, actor["email"], TEST_PASSWORD).json()["tokens"]
    headers = {
        "Authorization": f"Bearer {tokens['access_token']}",
        "X-Login-Id": str(actor["login_id"]),
    }
    resp = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "Wrongpass123!", "new_password": "Newpass456!"},
        headers=headers,
    )
    assert resp.status_code == 401


def test_032_forgot_reset_flow_and_reuse_rejected(client, factory, monkeypatch):
    actor = factory.actor("auth")
    monkeypatch.setattr(
        "app.modules.auth.service.secrets.token_urlsafe", lambda _n: "fixed-test-token"
    )
    forgot = client.post(
        "/api/v1/auth/forgot-password", json={"email": actor["email"]}
    )
    assert forgot.status_code == 200, forgot.text
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "fixed-test-token", "new_password": "Newpass456!"},
    )
    assert reset.status_code == 200, reset.text
    assert _login(client, actor["email"], "Newpass456!").status_code == 200
    reuse = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "fixed-test-token", "new_password": "Another789!"},
    )
    assert reuse.status_code == 400
    bad = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "bogus-token", "new_password": "Another789!"},
    )
    assert bad.status_code == 400


def test_033_missing_x_login_id_rejected(client, factory):
    actor = factory.actor("auth")
    tokens = _login(client, actor["email"], TEST_PASSWORD).json()["tokens"]
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    resp = client.post("/api/v1/auth/logout", headers=headers)
    assert resp.status_code == 422
