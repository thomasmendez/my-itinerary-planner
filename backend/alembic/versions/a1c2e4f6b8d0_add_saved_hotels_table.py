"""add saved_hotels table

Revision ID: a1c2e4f6b8d0
Revises: 933808874e99
Create Date: 2026-08-29 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c2e4f6b8d0'
down_revision: Union[str, Sequence[str], None] = '933808874e99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('saved_hotels',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('check_in_date', sa.String(), nullable=False),
    sa.Column('check_out_date', sa.String(), nullable=False),
    sa.Column('price_per_night', sa.Float(), nullable=False),
    sa.Column('rating', sa.Float(), nullable=True),
    sa.Column('distance_km', sa.Float(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('raw_payload', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('saved_hotels')
