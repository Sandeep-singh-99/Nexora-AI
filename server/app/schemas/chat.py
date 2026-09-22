from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    tokens_used: Optional[int] = None
    extra_metadata: Optional[Dict[str, Any]] = Field(default=None, serialization_alias="metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    message: Optional[str] = None
    document_name: Optional[str] = None


class TitleGenerateRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message or prompt")
    document_name: Optional[str] = None
    assistant_response: Optional[str] = None


class TitleGenerateResponse(BaseModel):
    title: str
    conversation_id: Optional[UUID] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, description="User query or instruction")
    conversation_id: Optional[UUID] = None
