"""Projects module seed."""
from __future__ import annotations
from pathlib import Path
from typing import Any
import json

def build_seed() -> dict[str, Any]:
    base = Path(__file__).parent
    a = json.loads((base / "projects_data_a.json").read_text(encoding="utf-8"))
    b = json.loads((base / "projects_data_b.json").read_text(encoding="utf-8"))
    return {**a, **b}
