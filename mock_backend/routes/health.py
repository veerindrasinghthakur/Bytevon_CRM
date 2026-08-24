from fastapi import APIRouter
from store import load, STORE_PATH

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    db = load()
    return {
        "status": "ok",
        "store": str(STORE_PATH),
        "collections": {k: (len(v) if isinstance(v, list) else type(v).__name__) for k, v in db.items()},
    }
