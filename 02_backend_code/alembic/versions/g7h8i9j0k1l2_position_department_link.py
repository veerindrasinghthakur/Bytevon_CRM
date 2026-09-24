"""Link positions to departments (position.department_id, nullable FK).

Revision ID: g7h8i9j0k1l2
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "cb66898874ca"


def upgrade() -> None:
    op.add_column(
        "positions",
        sa.Column("department_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_positions_department_id",
        "positions",
        "departments",
        ["department_id"],
        ["id"],
    )
    op.create_index("ix_positions_department_id", "positions", ["department_id"])
    # Existing rows keep NULL = unassigned (shown for all departments).


def downgrade() -> None:
    op.drop_index("ix_positions_department_id", table_name="positions")
    op.drop_constraint("fk_positions_department_id", "positions", type_="foreignkey")
    op.drop_column("positions", "department_id")
