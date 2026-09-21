from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default_session"
    document_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: Optional[str] = "default_session"


class DeleteConversationResponse(BaseModel):
    success: bool = True
    message: str = "AI chat conversation deleted successfully"
    thread_id: str