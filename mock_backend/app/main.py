"""
ByteVon temporary mock backend.

The complete JSON-store API lives at the package root (`main.py`, `routes/`,
`store.py`, `seed.py`). This module re-exports that app so both entry points work:

  uvicorn main:app --reload --host 0.0.0.0 --port 8001
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
"""
from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from main import app  # noqa: E402, F401
