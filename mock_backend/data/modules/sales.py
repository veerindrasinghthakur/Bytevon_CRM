"""Sales module seed."""
from __future__ import annotations
from pathlib import Path
from typing import Any
import json

def build_seed() -> dict[str, Any]:
    p = Path(__file__).with_name("sales_data.json")
    return json.loads(p.read_text(encoding="utf-8"))
