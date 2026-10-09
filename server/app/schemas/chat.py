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
    model: Optional[str] = "groq"


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
    model: Optional[str] = None


class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    is_pinned: bool
    is_archived: bool
    model: Optional[str] = "groq"
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, description="User query or instruction")
    conversation_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None


class TimelinePoint(BaseModel):
    label: str
    date: str
    prebuilt_tokens: int = 0
    custom_tokens: int = 0
    total_tokens: int = 0
    requests: int = 0


class ProviderStat(BaseModel):
    provider: str
    tokens: int = 0
    requests: int = 0
    percentage: float = 0.0
    models: Dict[str, int] = Field(default_factory=dict)


class ModelStat(BaseModel):
    model: str
    provider: str
    tokens: int = 0
    requests: int = 0
    percentage: float = 0.0


class TokenActivityItem(BaseModel):
    id: UUID
    conversation_id: UUID
    conversation_title: Optional[str] = "Chat"
    role: str
    provider: str
    model: str
    is_custom_key: bool = False
    tokens_used: int = 0
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    created_at: datetime


class TokenAnalyticsResponse(BaseModel):
    timeframe: str
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    prebuilt_tokens: int = 0
    custom_tokens: int = 0
    prebuilt_percentage: float = 0.0
    custom_percentage: float = 0.0
    total_requests: int = 0
    prebuilt_requests: int = 0
    custom_requests: int = 0
    estimated_cost_usd: float = 0.0
    avg_tokens_per_request: float = 0.0
    top_provider: Optional[str] = None
    top_model: Optional[str] = None
    providers: List[ProviderStat] = Field(default_factory=list)
    models: List[ModelStat] = Field(default_factory=list)
    timeline: List[TimelinePoint] = Field(default_factory=list)
    recent_activity: List[TokenActivityItem] = Field(default_factory=list)

