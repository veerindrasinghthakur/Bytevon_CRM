"""Client extra profile columns (legal_name, tax_id, founded, chat_link).

Revision ID: h8i9j0k1l2m3
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"


def upgrade() -> None:
    op.add_column("clients", sa.Column("legal_name", sa.String(255), nullable=True))
    op.add_column("clients", sa.Column("tax_id", sa.String(100), nullable=True))
    op.add_column("clients", sa.Column("founded", sa.String(100), nullable=True))
    op.add_column("clients", sa.Column("chat_link", sa.String(500), nullable=True))
    # Existing rows keep NULL (frontend renders "—").


def downgrade() -> None:
    op.drop_column("clients", "chat_link")
    op.drop_column("clients", "founded")
    op.drop_column("clients", "tax_id")
    op.drop_column("clients", "legal_name")
