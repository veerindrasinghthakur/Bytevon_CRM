"""
ByteVon temporary mock backend.

Run:
  uvicorn app.main:app --reload --port 8001
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.middleware import MockAuthMiddleware
from app.services import store
from app.routes import auth, admin_users, admin_roles, admin_audit, admin_settings, admin_metrics, mock_ops

app = FastAPI(
    title="ByteVon Mock Backend",
    description="Temporary JSON-backed API for frontend flow testing. No validation. Auth bypassed.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(MockAuthMiddleware)

app.include_router(mock_ops.router)
app.include_router(auth.router)
app.include_router(admin_users.router)
app.include_router(admin_roles.router)
app.include_router(admin_audit.router)
app.include_router(admin_settings.router)
app.include_router(admin_metrics.router)


@app.on_event("startup")
def on_startup():
    store.ensure_store()


@app.get("/")
def root():
    return {
        "service": "bytevon-mock-backend",
        "docs": "/docs",
        "health": "/mock/health",
        "reset": "POST /mock/reset",
        "note": "Temporary — delete when real backend is connected",
    }
