"""
Simple JSON file store — no validation, no ORM.
All mutations read → modify → write. Single-process only (demo).
"""

from __future__ import annotations

import json
import threading
from copy import deepcopy
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"
STORE_PATH = DATA_DIR / "store.json"

_lock = threading.RLock()
_cache: dict[str, Any] | None = None


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load() -> dict[str, Any]:
    global _cache
    with _lock:
        if _cache is not None:
            return _cache
        _ensure_dir()
        if not STORE_PATH.exists():
            _cache = {}
            return _cache
        with STORE_PATH.open("r", encoding="utf-8") as f:
            _cache = json.load(f)
        return _cache


def save(data: dict[str, Any] | None = None) -> None:
    global _cache
    with _lock:
        if data is not None:
            _cache = data
        assert _cache is not None
        _ensure_dir()
        tmp = STORE_PATH.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(_cache, f, indent=2, ensure_ascii=False, default=str)
        tmp.replace(STORE_PATH)


def get_collection(name: str) -> list[Any]:
    db = load()
    if name not in db or not isinstance(db[name], list):
        db[name] = []
        save(db)
    return db[name]


def set_collection(name: str, items: list[Any]) -> None:
    db = load()
    db[name] = items
    save(db)


def get_obj(name: str, default: Any = None) -> Any:
    db = load()
    return db.get(name, default)


def set_obj(name: str, value: Any) -> None:
    db = load()
    db[name] = value
    save(db)


def next_id(collection: str, id_key: str = "id") -> int:
    items = get_collection(collection)
    nums = []
    for it in items:
        v = it.get(id_key) if isinstance(it, dict) else None
        if isinstance(v, int):
            nums.append(v)
        elif isinstance(v, str) and v.isdigit():
            nums.append(int(v))
        elif isinstance(v, str):
            # R-01, U-1001, AUD-9001
            tail = v.rsplit("-", 1)[-1]
            if tail.isdigit():
                nums.append(int(tail))
    return (max(nums) + 1) if nums else 1


def snapshot() -> dict[str, Any]:
    return deepcopy(load())
