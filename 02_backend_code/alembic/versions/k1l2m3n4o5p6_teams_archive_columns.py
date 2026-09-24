"""Teams archive columns (idempotent; older databases lack them).

Revision ID: k1l2m3n4o5p6
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, None] = "j0k1l2m3n4o5"


def upgrade() -> None:
    op.execute("ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE teams ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL")
    op.execute("ALTER TABLE teams ADD COLUMN IF NOT EXISTS archived_by INTEGER NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE teams DROP COLUMN IF EXISTS archived_by")
    op.execute("ALTER TABLE teams DROP COLUMN IF EXISTS archived_at")
    op.execute("ALTER TABLE teams DROP COLUMN IF EXISTS is_archived")
