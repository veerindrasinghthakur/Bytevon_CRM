"""Auth bypass — accept any Authorization header; attach mock user."""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import DEFAULT_MOCK_USER_ID
from app.services import store


class MockAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Never reject — demo only
        raw = request.headers.get("X-Mock-User-Id")
        try:
            user_id = int(raw) if raw else DEFAULT_MOCK_USER_ID
        except ValueError:
            user_id = DEFAULT_MOCK_USER_ID

        users = store.read_list("users.json")
        user = next((u for u in users if u.get("id") == user_id), None)
        if user is None and users:
            user = users[0]
        request.state.mock_user = user
        request.state.mock_user_id = user["id"] if user else user_id
        request.state.mock_token = request.headers.get("Authorization", "")
        return await call_next(request)
