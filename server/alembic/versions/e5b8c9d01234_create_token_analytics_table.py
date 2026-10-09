"""Create token analytics table

Revision ID: e5b8c9d01234
Revises: d4a7b1c829e0
Create Date: 2026-10-09 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e5b8c9d01234'
down_revision: Union[str, Sequence[str], None] = 'd4a7b1c829e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'token_analytics',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=True),
        sa.Column('message_id', sa.UUID(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='groq'),
        sa.Column('model', sa.String(length=100), nullable=False, server_default='llama-3.3-70b-versatile'),
        sa.Column('is_custom_key', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('prompt_tokens', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('completion_tokens', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('total_tokens', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('estimated_cost_usd', sa.Float(), nullable=False, server_default=sa.text('0.0')),
        sa.Column('request_type', sa.String(length=50), nullable=False, server_default='chat'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_token_analytics_user_id'), 'token_analytics', ['user_id'], unique=False)
    op.create_index(op.f('ix_token_analytics_conversation_id'), 'token_analytics', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_token_analytics_message_id'), 'token_analytics', ['message_id'], unique=False)
    op.create_index(op.f('ix_token_analytics_provider'), 'token_analytics', ['provider'], unique=False)
    op.create_index(op.f('ix_token_analytics_model'), 'token_analytics', ['model'], unique=False)
    op.create_index(op.f('ix_token_analytics_total_tokens'), 'token_analytics', ['total_tokens'], unique=False)
    op.create_index(op.f('ix_token_analytics_created_at'), 'token_analytics', ['created_at'], unique=False)
    op.create_index('ix_token_analytics_user_created', 'token_analytics', ['user_id', 'created_at'], unique=False)

    # Backfill existing assistant messages into token_analytics if any exist
    op.execute("""
        INSERT INTO token_analytics (
            id, user_id, conversation_id, message_id, provider, model, is_custom_key,
            prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, request_type, metadata, created_at
        )
        SELECT 
            gen_random_uuid(),
            c.user_id,
            m.conversation_id,
            m.id,
            COALESCE(m.metadata->>'provider', 'groq'),
            COALESCE(m.metadata->>'model', c.model, 'llama-3.3-70b-versatile'),
            COALESCE((m.metadata->>'is_custom_key')::boolean, false),
            COALESCE((m.metadata->>'prompt_tokens')::integer, GREATEST(5, m.tokens_used - 10)),
            COALESCE((m.metadata->>'completion_tokens')::integer, GREATEST(10, m.tokens_used - 5)),
            COALESCE(m.tokens_used, 25),
            COALESCE(m.tokens_used, 25) * 0.000001,
            'chat',
            m.metadata,
            m.created_at
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE m.role = 'assistant'
        ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    op.drop_index('ix_token_analytics_user_created', table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_created_at'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_total_tokens'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_model'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_provider'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_message_id'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_conversation_id'), table_name='token_analytics')
    op.drop_index(op.f('ix_token_analytics_user_id'), table_name='token_analytics')
    op.drop_table('token_analytics')
