"""JSON file read/write — no validation."""
from __future__ import annotations

import json
import shutil
import threading
from copy import deepcopy
from pathlib import Path
from typing import Any

from app.config import SEED_DIR, STORE_DIR

_lock = threading.RLock()


def _store_path(name: str) -> Path:
    return STORE_DIR / name


def _seed_path(name: str) -> Path:
    return SEED_DIR / name


def ensure_store() -> None:
    """Copy seed → store if store file missing."""
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    for seed in SEED_DIR.glob("*.json"):
        dest = _store_path(seed.name)
        if not dest.exists():
            shutil.copy2(seed, dest)


def reset_store() -> None:
    """Wipe store and re-copy all seed files."""
    with _lock:
        if STORE_DIR.exists():
            for f in STORE_DIR.glob("*.json"):
                f.unlink()
        ensure_store()


def read(name: str) -> Any:
    ensure_store()
    path = _store_path(name)
    if not path.exists():
        seed = _seed_path(name)
        if seed.exists():
            shutil.copy2(seed, path)
        else:
            return [] if name.endswith("s.json") else {}
    with _lock:
        return json.loads(path.read_text(encoding="utf-8"))


def write(name: str, data: Any) -> None:
    ensure_store()
    path = _store_path(name)
    with _lock:
        path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def read_list(name: str) -> list:
    data = read(name)
    return data if isinstance(data, list) else []


def read_obj(name: str) -> dict:
    data = read(name)
    return data if isinstance(data, dict) else {}


def next_id(meta_key: str) -> int:
    meta = read_obj("meta.json")
    val = int(meta.get(meta_key, 1))
    meta[meta_key] = val + 1
    write("meta.json", meta)
    return val


def clone(obj: Any) -> Any:
    return deepcopy(obj)
