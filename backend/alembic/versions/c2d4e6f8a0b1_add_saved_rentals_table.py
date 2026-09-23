"""add saved_rentals table

Revision ID: c2d4e6f8a0b1
Revises: a1c2e4f6b8d0
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2d4e6f8a0b1'
down_revision: Union[str, Sequence[str], None] = 'a1c2e4f6b8d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('saved_rentals',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('pickup_location', sa.String(), nullable=False),
    sa.Column('pickup_at', sa.String(), nullable=False),
    sa.Column('dropoff_at', sa.String(), nullable=False),
    sa.Column('price', sa.Float(), nullable=True),
    sa.Column('raw_payload', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('saved_rentals')
