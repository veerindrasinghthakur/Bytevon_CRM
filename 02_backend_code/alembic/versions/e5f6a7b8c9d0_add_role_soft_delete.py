"""add role soft-delete columns (remove hard-delete path)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('roles', sa.Column('is_archived', sa.Boolean(), server_default='false', nullable=False, comment='Whether this role has been soft-deleted'))
    op.add_column('roles', sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True, comment='Soft-delete timestamp'))
    op.add_column('roles', sa.Column('archived_by', sa.Integer(), nullable=True, comment='Employment ID who deleted this role'))


def downgrade() -> None:
    op.drop_column('roles', 'archived_by')
    op.drop_column('roles', 'archived_at')
    op.drop_column('roles', 'is_archived')
