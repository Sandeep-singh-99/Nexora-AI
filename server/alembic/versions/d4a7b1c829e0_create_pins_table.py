"""Create pins table

Revision ID: d4a7b1c829e0
Revises: c8e9f3b21a04
Create Date: 2026-09-19 11:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a7b1c829e0'
down_revision: Union[str, Sequence[str], None] = 'c8e9f3b21a04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pins',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pins_conversation_id'), 'pins', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_pins_message_id'), 'pins', ['message_id'], unique=False)
    op.create_index(op.f('ix_pins_user_id'), 'pins', ['user_id'], unique=False)
    op.create_index('uq_pins_conversation_message', 'pins', ['conversation_id', 'message_id'], unique=True)


def downgrade() -> None:
    op.drop_index('uq_pins_conversation_message', table_name='pins')
    op.drop_index(op.f('ix_pins_user_id'), table_name='pins')
    op.drop_index(op.f('ix_pins_message_id'), table_name='pins')
    op.drop_index(op.f('ix_pins_conversation_id'), table_name='pins')
    op.drop_table('pins')
