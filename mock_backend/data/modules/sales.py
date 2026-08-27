"""Load sales_seed.json seed."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any

_JSON = Path(__file__).with_name("sales_seed.json")

def build_seed() -> dict[str, Any]:
    return json.loads(_JSON.read_text(encoding="utf-8"))
