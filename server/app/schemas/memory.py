from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class UserMemoryCreate(BaseModel):
    memory_text: str = Field(..., min_length=1, description="Fact or preference to remember")
    category: Optional[str] = "general"


class UserMemoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    memory_text: str
    category: str
    confidence_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserMemoryListResponse(BaseModel):
    memories: List[UserMemoryResponse]
