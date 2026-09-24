"""Leads archive columns (soft delete; idempotent for older databases).

Revision ID: l2m3n4o5p6q7
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, None] = "k1l2m3n4o5p6"


def upgrade() -> None:
    op.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL")
    op.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_by INTEGER NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS archived_by")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS archived_at")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS is_archived")
