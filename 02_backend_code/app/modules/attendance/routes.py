"""DEPRECATED — policy routes moved to /organization/attendance-policies.

Kept as empty router so accidental includes do not 404 the whole app.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/attendance", tags=["Attendance (deprecated)"])
