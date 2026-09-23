"""add events table

Revision ID: d3e5f7a9c1b2
Revises: c2d4e6f8a0b1
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3e5f7a9c1b2'
down_revision: Union[str, Sequence[str], None] = 'c2d4e6f8a0b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('location', sa.String(), nullable=True),
    sa.Column('starts_at', sa.String(), nullable=False),
    sa.Column('ends_at', sa.String(), nullable=True),
    sa.Column('price', sa.Float(), nullable=True),
    sa.Column('raw_payload', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('events')
