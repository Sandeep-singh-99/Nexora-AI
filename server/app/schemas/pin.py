from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.chat import MessageResponse


class PinCreate(BaseModel):
    conversation_id: UUID
    message_id: UUID
    note: Optional[str] = Field(default=None, max_length=255)


class PinUpdate(BaseModel):
    note: Optional[str] = Field(default=None, max_length=255)


class PinResponse(BaseModel):
    id: UUID
    user_id: UUID
    conversation_id: UUID
    message_id: UUID
    note: Optional[str] = None
    created_at: datetime
    message: Optional[MessageResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PinListResponse(BaseModel):
    pins: List[PinResponse]
