"""Attendance monthly summary: break_minutes column.

Revision ID: o5p6q7r8s9t0
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "o5p6q7r8s9t0"
down_revision: Union[str, None] = "n4o5p6q7r8s9"


def upgrade() -> None:
    op.execute(
        "ALTER TABLE monthly_attendance_summaries "
        "ADD COLUMN IF NOT EXISTS break_minutes NUMERIC(8, 2) NULL"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE monthly_attendance_summaries DROP COLUMN IF EXISTS break_minutes")
