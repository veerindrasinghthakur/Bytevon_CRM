"""
ByteVon CRM — TEMPORARY mock backend (JSON store, auth bypass).
Delete this package when real backend is integrated.

Run:
  cd mock_backend
  pip install -r requirements.txt
  python seed.py
  uvicorn main:app --reload --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from routes import (
    admin,
    approvals,
    auth,
    dashboard,
    health,
    my_work,
    organization,
    payroll,
    projects,
    sales,
    workforce,
)
from store import STORE_PATH, load

app = FastAPI(
    title="ByteVon Mock Backend",
    description="Temporary JSON-backed API for frontend flow testing. No validation.",
    version="0.4.0-demo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthBypassMiddleware(BaseHTTPMiddleware):
    """Accept any Authorization header (or none). Never returns 401."""

    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        request.state.bypass_auth = True
        request.state.token = None
        if auth_header and auth_header.lower().startswith("bearer "):
            request.state.token = auth_header[7:].strip()
        response: Response = await call_next(request)
        response.headers["X-Mock-Backend"] = "bytevon-demo"
        return response


app.add_middleware(AuthBypassMiddleware)

# Mount under /api/v1 (matches real backend) and also without prefix for flexibility
MODULE_ROUTERS = (
    health,
    auth,
    admin,
    organization,
    dashboard,
    my_work,
    sales,
    projects,
    workforce,
    payroll,
    approvals,
)

for r in MODULE_ROUTERS:
    if r is health:
        app.include_router(r.router)
    else:
        app.include_router(r.router, prefix="/api/v1")
        app.include_router(r.router)


@app.on_event("startup")
def _startup() -> None:
    if not STORE_PATH.exists():
        from seed import main as seed_main

        seed_main()
    else:
        load()  # warm cache
    print(f"[mock] store ready: {STORE_PATH}")


@app.get("/")
def root():
    return {
        "service": "bytevon-mock-backend",
        "docs": "/docs",
        "modules": [
            "auth",
            "admin",
            "organization",
            "dashboard",
            "my-work",
            "sales",
            "projects",
            "workforce",
            "payroll",
            "approvals",
        ],
        "hint": "POST /api/v1/admin/_reset to re-seed",
    }
