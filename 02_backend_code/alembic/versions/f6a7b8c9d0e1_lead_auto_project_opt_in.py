"""Q12: lead auto_create_project default false (opt-in project on WON).

Revision ID: f6a7b8c9d0e1
"""
from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"


def upgrade() -> None:
    op.alter_column(
        "leads",
        "auto_create_project",
        existing_type=sa.Boolean(),
        server_default="false",
        existing_nullable=False,
    )
    # Existing rows keep their stored values; only the default changes.


def downgrade() -> None:
    op.alter_column(
        "leads",
        "auto_create_project",
        existing_type=sa.Boolean(),
        server_default="true",
        existing_nullable=False,
    )
