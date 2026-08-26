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

try:
    from routes import admin, auth, health, extras, sales, my_work
except ImportError as e:
    raise SystemExit(
        "Mock backend routes incomplete. Ensure routes/admin.py, auth.py, health.py, "
        "extras.py, sales.py, my_work.py exist.\n"
        f"Original error: {e}"
    ) from e
from store import STORE_PATH, load

app = FastAPI(
    title="ByteVon Mock Backend",
    description="Temporary JSON-backed API for frontend flow testing. No validation.",
    version="0.2.0-demo",
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

app.include_router(health.router)
app.include_router(extras.router, prefix="/api/v1")
app.include_router(extras.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(my_work.router, prefix="/api/v1")
app.include_router(my_work.router)
# app.include_router(admin.router, prefix="/api/v1")
# app.include_router(sales.router, prefix="/api/v1")
# app.include_router(auth.router)
# app.include_router(admin.router)
# app.include_router(sales.router)


@app.on_event("startup")
def _startup() -> None:
    if not STORE_PATH.exists():
        from seed import main as seed_main

        seed_main()
    else:
        load()
        # Ensure my-work collections exist on older store.json files
        from data.modules.my_work import build_seed
        from store import save

        db = load()
        mw = build_seed()
        missing = [k for k in mw if k not in db]
        if missing:
            for k in missing:
                db[k] = mw[k]
            save(db)
            print(f"[mock] merged missing my-work keys: {missing}")
    print(f"[mock] store ready: {STORE_PATH}")


@app.get("/")
def root():
    return {
        "service": "bytevon-mock-backend",
        "status": "ok",
        "docs": "/docs",
        "note": "TEMPORARY — auth bypassed; JSON file store",
        "login": "POST /api/v1/auth/login  admin@bytevon.local / ChangeMeAdmin!123",
        "sales": "/api/v1/sales/leads",
        "myWork": "/api/v1/my-work/overview",
    }
