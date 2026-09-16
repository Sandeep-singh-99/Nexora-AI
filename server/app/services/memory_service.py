import uuid
import logging
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_memory import UserMemory
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy initialized embedding model
_embedding_model = None

def get_text_embedding(text: str) -> List[float]:
    """
    Generate a 768-dimensional float vector embedding for the given text.
    Uses sentence-transformers if available, with robust zero-padding/truncation to 768 dimensions.
    """
    global _embedding_model
    target_dim = 768

    try:
        if _embedding_model is None:
            from sentence_transformers import SentenceTransformer
            # Load a standard, fast 768-dim or 384-dim model
            model_name = settings.EMBEDDING_MODEL or "sentence-transformers/all-mpnet-base-v2"
            try:
                _embedding_model = SentenceTransformer(model_name)
            except Exception as e:
                logger.warning(f"Could not load custom embedding model {model_name}, falling back to all-MiniLM-L6-v2: {e}")
                _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        raw_vector = _embedding_model.encode(text).tolist()
        
        # Adjust dimensions to match schema Vector(768)
        if len(raw_vector) < target_dim:
            raw_vector = raw_vector + [0.0] * (target_dim - len(raw_vector))
        elif len(raw_vector) > target_dim:
            raw_vector = raw_vector[:target_dim]

        return raw_vector
    except Exception as err:
        logger.error(f"Error generating embedding: {err}")
        # Deterministic fallback pseudo-vector if model fails
        import hashlib
        hash_bytes = hashlib.sha256(text.encode('utf-8')).digest()
        fallback = [((b / 255.0) - 0.5) for b in hash_bytes]
        # Repeat to fill 768
        full_fallback = (fallback * (target_dim // len(fallback) + 1))[:target_dim]
        return full_fallback


class MemoryService:

    @staticmethod
    async def add_memory(
        db: AsyncSession,
        user_id: UUID,
        memory_text: str,
        category: str = "general",
        confidence_score: float = 1.0,
    ) -> UserMemory:
        """Add a new long-term memory fact for a user."""
        memory_text_clean = memory_text.strip()
        if not memory_text_clean:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Memory text cannot be empty")

        embedding_vector = get_text_embedding(memory_text_clean)

        memory = UserMemory(
            user_id=user_id,
            memory_text=memory_text_clean,
            category=category,
            embedding=embedding_vector,
            confidence_score=confidence_score,
        )
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        return memory

    @staticmethod
    async def get_relevant_memories(
        db: AsyncSession,
        user_id: UUID,
        query_text: str,
        limit: int = 5,
    ) -> List[UserMemory]:
        """Query top-K relevant memories using pgvector cosine distance search."""
        if not query_text or not query_text.strip():
            return []

        query_vector = get_text_embedding(query_text.strip())

        stmt = (
            select(UserMemory)
            .where(UserMemory.user_id == user_id)
            .order_by(UserMemory.embedding.cosine_distance(query_vector))
            .limit(limit)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_user_memories(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 100,
    ) -> List[UserMemory]:
        """Fetch all long-term memories stored for a user."""
        stmt = (
            select(UserMemory)
            .where(UserMemory.user_id == user_id)
            .order_by(UserMemory.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def delete_memory(
        db: AsyncSession,
        memory_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Delete a memory entry by ID."""
        stmt = select(UserMemory).where(
            UserMemory.id == memory_id,
            UserMemory.user_id == user_id,
        )
        result = await db.execute(stmt)
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory entry not found")

        await db.delete(memory)
        await db.commit()
        return True

    @staticmethod
    async def extract_and_save_memories_from_text(
        db: AsyncSession,
        user_id: UUID,
        user_text: str,
    ):
        """
        Background task to extract facts from user message and store them into UserMemory.
        Recognizes preference phrases like 'I use', 'I am', 'my favorite', 'I like', 'I work with'.
        """
        user_text_lower = user_text.lower().strip()
        
        # Simple extraction triggers
        memory_triggers = ["i use ", "i am ", "my name is ", "i work on ", "i prefer ", "i like ", "my stack is "]
        
        for trigger in memory_triggers:
            if trigger in user_text_lower:
                # Extract candidate memory text
                memory_candidate = user_text.strip()
                if len(memory_candidate) > 10 and len(memory_candidate) < 300:
                    # Check if similar memory already exists
                    existing = await MemoryService.get_relevant_memories(db, user_id, memory_candidate, limit=1)
                    if not existing:
                        await MemoryService.add_memory(
                            db=db,
                            user_id=user_id,
                            memory_text=memory_candidate,
                            category="user_preference",
                        )
                break
