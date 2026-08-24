"""Demo utilities: health, reset, dump."""
from __future__ import annotations

from fastapi import APIRouter

from app.services import store

router = APIRouter(prefix="/mock", tags=["mock-ops"])


@router.get("/health")
def health():
    return {"status": "ok", "mode": "mock-json"}


@router.post("/reset")
def reset():
    store.reset_store()
    return {"ok": True, "message": "Store reset from seed"}


@router.get("/collections")
def collections():
    store.ensure_store()
    from app.config import STORE_DIR
    return {"files": sorted(p.name for p in STORE_DIR.glob("*.json"))}
