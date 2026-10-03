from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.schemas.memory import (
    UserMemoryCreate,
    UserMemoryUpdate,
    UserMemoryResponse,
    UserMemoryListResponse,
    KnowledgeGraphResponse,
)
from app.services.memory_service import MemoryService

router = APIRouter(prefix="", tags=["Long-Term Memory"])


@router.get("", response_model=UserMemoryListResponse)
async def list_memories(
    category: Optional[str] = Query(None, description="Filter memories by category"),
    search: Optional[str] = Query(None, description="Search keyword in memory text"),
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all long-term memories stored for the current user with optional filtering."""
    memories = await MemoryService.get_all_user_memories(
        db=db,
        user_id=current_user.id,
        category=category,
        search=search,
        limit=limit,
    )
    return UserMemoryListResponse(memories=memories)


@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve personal knowledge graph network data for the current user.
    Links concepts, uploaded documents, and chat threads with semantic relationships.
    """
    graph_data = await MemoryService.get_knowledge_graph(
        db=db,
        user_id=current_user.id,
    )
    return graph_data


@router.post("", response_model=UserMemoryResponse, status_code=status.HTTP_201_CREATED)
async def add_memory(
    payload: UserMemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually store a long-term fact or preference for the current user."""
    memory = await MemoryService.add_memory(
        db=db,
        user_id=current_user.id,
        memory_text=payload.memory_text,
        category=payload.category or "general",
        confidence_score=payload.confidence_score if payload.confidence_score is not None else 1.0,
    )
    return memory


@router.get("/search", response_model=List[UserMemoryResponse])
async def search_memories(
    q: str = Query(..., min_length=1, description="Query text to search vector similarity against memories"),
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search relevant memories using pgvector cosine similarity."""
    memories = await MemoryService.get_relevant_memories(
        db=db,
        user_id=current_user.id,
        query_text=q,
        limit=limit,
    )
    return memories


@router.put("/{memory_id}", response_model=UserMemoryResponse)
async def update_memory(
    memory_id: UUID,
    payload: UserMemoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit or update an existing user fact/memory."""
    memory = await MemoryService.update_memory(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id,
        memory_text=payload.memory_text,
        category=payload.category,
        confidence_score=payload.confidence_score,
    )
    return memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific long-term memory entry."""
    await MemoryService.delete_memory(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id,
    )
    return None
