from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    ConversationListResponse,
    MessageResponse,
    ChatMessageRequest,
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="", tags=["Chat Storage"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat conversation session."""
    conversation = await ChatService.create_conversation(
        db=db,
        user_id=current_user.id,
        title=payload.title or "New Chat",
    )
    return conversation


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat conversations for current user."""
    conversations = await ChatService.get_user_conversations(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    return ConversationListResponse(conversations=conversations)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch details of a specific conversation with all messages."""
    conversation = await ChatService.get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        load_messages=True,
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: UUID,
    payload: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update title, pinned state, or archived state of a conversation."""
    conversation = await ChatService.update_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        title=payload.title,
        is_pinned=payload.is_pinned,
        is_archived=payload.is_archived,
    )
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation thread."""
    await ChatService.delete_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )
    return None


@router.delete("/conversations", status_code=status.HTTP_200_OK)
async def delete_all_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all conversations for the current user."""
    count = await ChatService.delete_all_conversations(
        db=db,
        user_id=current_user.id,
    )
    return {"message": f"Successfully deleted {count} conversations", "count": count}


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all messages for a specific conversation."""
    messages = await ChatService.get_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        limit=limit,
    )
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def add_message(
    conversation_id: UUID,
    payload: ChatMessageRequest,
    role: str = "user",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Append a message to a conversation thread."""
    # Ensure conversation exists & is owned
    await ChatService.get_conversation(db, conversation_id, current_user.id, load_messages=False)
    
    message = await ChatService.add_message(
        db=db,
        conversation_id=conversation_id,
        role=role,
        content=payload.content,
    )
    return message
