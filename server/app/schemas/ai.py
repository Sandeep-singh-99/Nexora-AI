from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default_session"
    document_id: Optional[str] = None
    model: Optional[str] = None
    custom_chat_key: Optional[str] = None
    custom_chat_provider: Optional[str] = None
    custom_chat_model: Optional[str] = None
    custom_embedding_key: Optional[str] = None
    custom_embedding_provider: Optional[str] = None
    custom_embedding_model: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: Optional[str] = "default_session"
    is_custom_key: Optional[bool] = None
    provider: Optional[str] = None


class DeleteConversationResponse(BaseModel):
    success: bool = True
    message: str = "AI chat conversation deleted successfully"
    thread_id: str