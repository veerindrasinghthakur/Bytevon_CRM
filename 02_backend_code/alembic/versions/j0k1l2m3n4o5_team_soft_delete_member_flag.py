"""Team member history flag.

- team_members: is_member flag; re-add inserts a NEW row, so the old
  UNIQUE(team_id, employment_id) becomes a partial unique index over
  active rows only.
- teams archive columns (is_archived/archived_at/archived_by) already exist
  in the base schema; the model just declares ArchiveMixin parity.

Revision ID: j0k1l2m3n4o5
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, None] = "h8i9j0k1l2m3"


def upgrade() -> None:
    op.add_column(
        "team_members",
        sa.Column("is_member", sa.Boolean(), nullable=False, server_default="true"),
    )
    # Backfill: rows that already left are history.
    op.execute("UPDATE team_members SET is_member = false WHERE left_at IS NOT NULL")
    op.drop_constraint("uq_team_members_team_employment", "team_members", type_="unique")
    op.create_index(
        "uq_team_members_active",
        "team_members",
        ["team_id", "employment_id"],
        unique=True,
        postgresql_where=sa.text("is_member = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_team_members_active", table_name="team_members")
    op.create_unique_constraint(
        "uq_team_members_team_employment", "team_members", ["team_id", "employment_id"]
    )
    op.drop_column("team_members", "is_member")
