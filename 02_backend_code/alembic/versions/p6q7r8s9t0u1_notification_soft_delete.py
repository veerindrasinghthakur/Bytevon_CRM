"""Notifications soft delete columns.

Revision ID: p6q7r8s9t0u1
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "p6q7r8s9t0u1"
down_revision: Union[str, None] = "o5p6q7r8s9t0"


def upgrade() -> None:
    op.execute(
        "ALTER TABLE notifications "
        "ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false"
    )
    op.execute(
        "ALTER TABLE notifications "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS is_deleted")
