from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_memory import Conversation, Message, Pin


class PinService:

    @staticmethod
    async def pin_message(
        db: AsyncSession,
        user_id: UUID,
        conversation_id: UUID,
        message_id: UUID,
        note: Optional[str] = None,
    ) -> Pin:
        """Pin a message within a conversation."""
        # 1. Verify conversation ownership
        conv_stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        conv_result = await db.execute(conv_stmt)
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        # 2. Verify message exists and belongs to conversation
        msg_stmt = select(Message).where(
            Message.id == message_id,
            Message.conversation_id == conversation_id,
        )
        msg_result = await db.execute(msg_stmt)
        message = msg_result.scalar_one_or_none()
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found in conversation",
            )

        # 3. Check if pin already exists
        pin_stmt = (
            select(Pin)
            .where(
                Pin.conversation_id == conversation_id,
                Pin.message_id == message_id,
            )
            .options(selectinload(Pin.message))
        )
        pin_result = await db.execute(pin_stmt)
        existing_pin = pin_result.scalar_one_or_none()

        if existing_pin:
            if note is not None and existing_pin.note != note:
                existing_pin.note = note
                await db.commit()
                await db.refresh(existing_pin)
            return existing_pin

        # 4. Create new pin
        pin = Pin(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            note=note,
        )
        db.add(pin)
        await db.commit()
        await db.refresh(pin)

        # Eager load message for response
        pin.message = message
        return pin

    @staticmethod
    async def get_pin(
        db: AsyncSession,
        user_id: UUID,
        pin_id: UUID,
    ) -> Optional[Pin]:
        """Fetch a specific pin owned by user."""
        stmt = (
            select(Pin)
            .where(
                Pin.id == pin_id,
                Pin.user_id == user_id,
            )
            .options(selectinload(Pin.message))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_pins(
        db: AsyncSession,
        user_id: UUID,
        conversation_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Pin]:
        """Fetch all pinned messages for a user, optionally filtered by conversation."""
        stmt = (
            select(Pin)
            .where(Pin.user_id == user_id)
            .options(selectinload(Pin.message))
            .order_by(Pin.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if conversation_id:
            stmt = stmt.where(Pin.conversation_id == conversation_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def unpin_message(
        db: AsyncSession,
        user_id: UUID,
        pin_id: UUID,
    ) -> bool:
        """Unpin a message by pin ID."""
        pin = await PinService.get_pin(db, user_id, pin_id)
        if not pin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pin not found",
            )

        await db.delete(pin)
        await db.commit()
        return True

    @staticmethod
    async def unpin_by_message_id(
        db: AsyncSession,
        user_id: UUID,
        message_id: UUID,
        conversation_id: Optional[UUID] = None,
    ) -> bool:
        """Unpin a message by its message ID."""
        stmt = select(Pin).where(
            Pin.user_id == user_id,
            Pin.message_id == message_id,
        )
        if conversation_id:
            stmt = stmt.where(Pin.conversation_id == conversation_id)

        result = await db.execute(stmt)
        pin = result.scalar_one_or_none()
        if not pin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pin not found for message",
            )

        await db.delete(pin)
        await db.commit()
        return True
