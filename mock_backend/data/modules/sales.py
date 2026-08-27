"""Sales module seed."""
from __future__ import annotations
from pathlib import Path
from typing import Any
import json

def build_seed() -> dict[str, Any]:
    base = Path(__file__).parent
    a = (base / "_sales_a.txt").read_text(encoding="utf-8")
    b = (base / "_sales_b.txt").read_text(encoding="utf-8")
    return json.loads(a + b)
