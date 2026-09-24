"""add login soft-delete columns (remove hard-delete path)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('logins', sa.Column('is_archived', sa.Boolean(), server_default='false', nullable=False, comment='Whether this login has been soft-deleted'))
    op.add_column('logins', sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True, comment='Soft-delete timestamp'))
    op.add_column('logins', sa.Column('archived_by', sa.Integer(), nullable=True, comment='Employment ID who deleted this login'))


def downgrade() -> None:
    op.drop_column('logins', 'archived_by')
    op.drop_column('logins', 'archived_at')
    op.drop_column('logins', 'is_archived')
