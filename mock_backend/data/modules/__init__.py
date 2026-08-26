"""Module-scoped seed builders. Each returns a dict of store keys → values to merge."""
from __future__ import annotations

from typing import Any

from data.modules import my_work as my_work_mod


def merge_module_seeds(data: dict[str, Any] | None = None) -> dict[str, Any]:
    """Merge module seeds into an existing store dict (module keys overwrite)."""
    out: dict[str, Any] = dict(data or {})
    out.update(my_work_mod.build_seed())
    return out
