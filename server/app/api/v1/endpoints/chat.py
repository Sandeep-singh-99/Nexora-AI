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
    TitleGenerateRequest,
    TitleGenerateResponse,
)
from app.services.chat_service import ChatService
from app.ai.title_generator import generate_chatgpt_title
from app.core.rate_limit import rate_limit_ai
from app.core.redis_cache import get_cache, set_cache, invalidate_chat_cache

router = APIRouter(prefix="", tags=["Chat Storage"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat conversation session with ChatGPT-style title generation."""
    title = payload.title
    if payload.message:
        title = await generate_chatgpt_title(
            message=payload.message,
            document_name=payload.document_name,
        )
    elif not title or title == "New Chat":
        title = "New Chat"

    conversation = await ChatService.create_conversation(
        db=db,
        user_id=current_user.id,
        title=title,
    )
    # Invalidate conversation list cache for this user
    await invalidate_chat_cache(user_id=current_user.id)
    return conversation


@router.post("/conversations/{conversation_id}/generate-title", response_model=ConversationResponse)
async def generate_and_update_conversation_title(
    conversation_id: UUID,
    payload: TitleGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a ChatGPT-style title using AI and update the stored conversation if not already titled."""
    conversation = await ChatService.get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        load_messages=False,
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # If the conversation already has an established title (i.e. not "New Chat"), do not rewrite it
    if conversation.title and conversation.title.strip() != "New Chat":
        return conversation

    title = await generate_chatgpt_title(
        message=payload.message,
        document_name=payload.document_name,
        assistant_response=payload.assistant_response,
    )
    conversation = await ChatService.update_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        title=title,
    )
    # Invalidate caches for this conversation
    await invalidate_chat_cache(conversation_id=conversation_id, user_id=current_user.id)
    return conversation


@router.post("/generate-title", response_model=TitleGenerateResponse, dependencies=[Depends(rate_limit_ai)])
async def generate_title_preview(
    payload: TitleGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a ChatGPT-style title preview."""
    title = await generate_chatgpt_title(
        message=payload.message,
        document_name=payload.document_name,
        assistant_response=payload.assistant_response,
    )
    return TitleGenerateResponse(title=title)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat conversations for current user with Redis caching."""
    cache_key = f"cache:user_convs:{current_user.id}:{limit}:{offset}"
    cached = await get_cache(cache_key)
    if cached is not None:
        try:
            return ConversationListResponse.model_validate(cached)
        except Exception:
            pass

    conversations = await ChatService.get_user_conversations(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    response_data = ConversationListResponse(conversations=conversations)
    await set_cache(cache_key, response_data.model_dump(mode="json"), expire_seconds=300)
    return response_data


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch details of a specific conversation with all messages (Redis cached to reduce DB calls)."""
    cache_key = f"cache:conversation:{conversation_id}:{current_user.id}"
    cached = await get_cache(cache_key)
    if cached is not None:
        try:
            return ConversationResponse.model_validate(cached)
        except Exception:
            pass

    conversation = await ChatService.get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        load_messages=True,
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    response_data = ConversationResponse.model_validate(conversation)
    await set_cache(cache_key, response_data.model_dump(mode="json"), expire_seconds=600)
    return response_data


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
    # Invalidate cache
    await invalidate_chat_cache(conversation_id=conversation_id, user_id=current_user.id)
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
    # Invalidate cache
    await invalidate_chat_cache(conversation_id=conversation_id, user_id=current_user.id)
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
    # Invalidate all user chat caches
    await invalidate_chat_cache(user_id=current_user.id)
    return {"message": f"Successfully deleted {count} conversations", "count": count}


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all messages for a specific conversation with Redis caching."""
    cache_key = f"cache:messages:{conversation_id}:{current_user.id}:{limit}"
    cached = await get_cache(cache_key)
    if cached is not None:
        try:
            return [MessageResponse.model_validate(m) for m in cached]
        except Exception:
            pass

    messages = await ChatService.get_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        limit=limit,
    )
    response_data = [MessageResponse.model_validate(m) for m in messages]
    await set_cache(
        cache_key,
        [m.model_dump(mode="json") for m in response_data],
        expire_seconds=600,
    )
    return response_data


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
    conversation = await ChatService.get_conversation(db, conversation_id, current_user.id, load_messages=False)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )
    
    message = await ChatService.add_message(
        db=db,
        conversation_id=conversation_id,
        role=role,
        content=payload.content,
    )
    # Invalidate caches so next GET returns new message immediately
    await invalidate_chat_cache(conversation_id=conversation_id, user_id=current_user.id)
    return message
