import uuid
import logging
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field
from app.models.chat_memory import UserMemory
from app.core.config import settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


class ExtractedPreference(BaseModel):
    memory_text: str = Field(
        description="A concise, third-person declarative statement about the user's persistent preference, tech stack, habits, or personal facts (e.g. 'User prefers TypeScript with Next.js App Router')."
    )
    category: str = Field(
        default="preference",
        description="Category such as 'preference', 'technical_stack', 'work_context', 'personal', or 'general'."
    )
    confidence_score: float = Field(
        default=1.0,
        description="Confidence score between 0.0 and 1.0 indicating certainty of persistence."
    )


class PreferenceExtractionResult(BaseModel):
    preferences: List[ExtractedPreference] = Field(
        default_factory=list,
        description="List of persistent user preferences or durable facts extracted from the message. Returns an empty list if none are mentioned."
    )


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
    async def extract_and_save_preferences_task(
        user_id: UUID,
        user_text: str,
        db: Optional[AsyncSession] = None,
    ) -> List[UserMemory]:
        """
        Background task to extract persistent user preferences (e.g. 'User prefers TypeScript with Next.js App Router')
        using an LLM structured parser and save them into UserMemory via pgvector.
        """
        user_text_clean = user_text.strip() if user_text else ""
        if not user_text_clean or len(user_text_clean) < 10:
            return []

        lower_text = user_text_clean.lower()
        if lower_text in {"hi", "hello", "hey", "thanks", "thank you", "bye", "ok", "okay"}:
            return []

        async def _do_extraction(session: AsyncSession) -> List[UserMemory]:
            try:
                from app.ai.core.llm import get_llm
                llm = get_llm("groq")
                structured_llm = llm.with_structured_output(PreferenceExtractionResult)
            except Exception as e:
                logger.warning("Could not initialize LLM for preference extraction: %s", e)
                return []

            extraction_prompt = (
                "You are an expert user-preference extraction engine for an AI assistant.\n"
                "Analyze the user message and extract any durable user preferences, tech stack choices, habits, "
                "work roles, or personal facts.\n\n"
                "CRITICAL RULES:\n"
                "1. Only extract persistent, reusable preferences or facts about the user (e.g., tech stacks, coding styles, roles, frameworks, languages).\n"
                "2. Do NOT extract ephemeral requests, one-time questions, bug reports, or task instructions (e.g., 'fix this bug', 'summarize this text', 'write a function').\n"
                "3. Format each extracted memory as a concise, third-person declarative statement starting with 'User...' (e.g., 'User prefers TypeScript with Next.js App Router').\n"
                "4. If no durable preferences or facts are mentioned, return an empty list.\n\n"
                f"User Message: {user_text_clean}"
            )

            try:
                parsed: PreferenceExtractionResult = await structured_llm.ainvoke(extraction_prompt)
            except Exception as e:
                logger.warning("Failed LLM preference extraction invoke: %s", e)
                return []

            if not parsed or not parsed.preferences:
                return []

            saved_memories: List[UserMemory] = []
            for item in parsed.preferences:
                fact = item.memory_text.strip()
                if not fact or len(fact) < 5:
                    continue

                try:
                    # Check for duplicate/near-identical memory in pgvector
                    existing = await MemoryService.get_relevant_memories(
                        db=session,
                        user_id=user_id,
                        query_text=fact,
                        limit=1,
                    )
                    if existing and existing[0].memory_text.lower().strip() == fact.lower().strip():
                        logger.debug("Preference already recorded: %s", fact)
                        continue

                    new_mem = await MemoryService.add_memory(
                        db=session,
                        user_id=user_id,
                        memory_text=fact,
                        category=item.category or "preference",
                        confidence_score=item.confidence_score or 1.0,
                    )
                    saved_memories.append(new_mem)
                    logger.info("Saved persistent user preference for user %s: '%s'", user_id, fact)
                except Exception as e:
                    logger.warning("Error saving extracted memory '%s': %s", fact, e)

            return saved_memories

        if db is not None:
            return await _do_extraction(db)
        else:
            async with AsyncSessionLocal() as session:
                return await _do_extraction(session)

    @staticmethod
    async def extract_and_save_memories_from_text(
        db: Optional[AsyncSession],
        user_id: UUID,
        user_text: str,
    ) -> List[UserMemory]:
        """Backward-compatible wrapper routing to extract_and_save_preferences_task."""
        return await MemoryService.extract_and_save_preferences_task(
            user_id=user_id,
            user_text=user_text,
            db=db,
        )

