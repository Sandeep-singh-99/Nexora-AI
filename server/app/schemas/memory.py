from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class UserMemoryCreate(BaseModel):
    memory_text: str = Field(..., min_length=1, description="Fact or preference to remember")
    category: Optional[str] = "general"
    confidence_score: Optional[float] = 1.0


class UserMemoryUpdate(BaseModel):
    memory_text: Optional[str] = Field(None, min_length=1, description="Updated fact or preference")
    category: Optional[str] = None
    confidence_score: Optional[float] = None


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


class KnowledgeGraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'user', 'concept', 'document', 'thread'
    category: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    relationship: Optional[str] = None


class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeGraphNode]
    edges: List[KnowledgeGraphEdge]
    stats: Dict[str, int]

