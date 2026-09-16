import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_memory import Conversation, Message, utc_now


class ChatService:

    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user_id: UUID,
        title: str = "New Chat",
    ) -> Conversation:
        """Create a new chat conversation session."""
        conversation = Conversation(
            user_id=user_id,
            title=title,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation.messages = []
        return conversation

    @staticmethod
    async def get_user_conversations(
        db: AsyncSession,
        user_id: UUID,
        include_messages: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Conversation]:
        """Fetch all conversations for a user ordered by pinned status and updated_at."""
        stmt = (
            select(Conversation)
            .where(
                Conversation.user_id == user_id,
                Conversation.is_archived == False,
                Conversation.messages.any(),
            )
            .order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if include_messages:
            stmt = stmt.options(selectinload(Conversation.messages))

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        load_messages: bool = True,
    ) -> Optional[Conversation]:
        """Fetch a specific conversation owned by user."""
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        if load_messages:
            stmt = stmt.options(selectinload(Conversation.messages))

        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        return conversation

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        title: Optional[str] = None,
        is_pinned: Optional[bool] = None,
        is_archived: Optional[bool] = None,
    ) -> Optional[Conversation]:
        """Update metadata (title, pinned, archived) of a conversation."""
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        if title is not None:
            conversation.title = title.strip()
        if is_pinned is not None:
            conversation.is_pinned = is_pinned
        if is_archived is not None:
            conversation.is_archived = is_archived

        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def delete_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Delete a conversation and all its messages."""
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        await db.delete(conversation)
        await db.commit()
        return True

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: UUID,
        role: str,
        content: str,
        tokens_used: Optional[int] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        """Add a new message to a conversation thread."""
        now = utc_now()
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tokens_used=tokens_used,
            extra_metadata=extra_metadata,
            created_at=now,
        )
        db.add(message)
        
        # Touch conversation updated_at
        stmt = (
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=now)
        )
        await db.execute(stmt)
        await db.commit()
        await db.refresh(message)
        return message

    @staticmethod
    async def get_messages(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        limit: int = 100,
    ) -> List[Message]:
        """Fetch messages in a conversation."""
        # Verify ownership
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
