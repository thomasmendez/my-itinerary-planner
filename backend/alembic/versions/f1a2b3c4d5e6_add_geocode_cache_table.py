"""add geocode_cache table

Revision ID: f1a2b3c4d5e6
Revises: d3e5f7a9c1b2
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd3e5f7a9c1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('geocode_cache',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('query', sa.String(), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('created_at', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('query')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('geocode_cache')
