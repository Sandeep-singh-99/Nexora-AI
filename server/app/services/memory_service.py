import re
import uuid
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field
from app.models.chat_memory import UserMemory, Conversation, utc_now
from app.models.document import Document
from app.models.auth import User
from app.core.config import settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "about", "above", "after", "again", "against", "all", "also", "and", "any", "are", "because",
    "been", "before", "being", "below", "between", "both", "but", "can", "cannot", "could", "did",
    "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "her", "here", "hers", "herself", "him", "himself", "his", "how", "into", "its", "itself",
    "more", "most", "not", "only", "other", "our", "ours", "out", "over", "same", "should", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "too", "under", "until", "very", "was", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "with", "would", "user", "prefers", "using", "uses",
    "likes", "always", "never", "code", "file", "make", "want"
}

def extract_meaningful_tokens(text: str) -> set[str]:
    """Extract significant keywords for personal knowledge graph linking."""
    if not text:
        return set()
    words = re.findall(r'[a-zA-Z0-9_\-\.]{3,}', text.lower())
    return {w.strip('.-_') for w in words if w.strip('.-_') not in STOP_WORDS and len(w.strip('.-_')) >= 3}


class ExtractedPreference(BaseModel):
    memory_text: str = Field(
        description="A concise, third-person declarative statement about the user's persistent preference, tech stack, habits, or personal facts (e.g. 'User prefers TypeScript with Next.js App Router')."
    )
    category: str = Field(
        default="tech_preference",
        description="Category such as 'tech_preference', 'coding_convention', 'project', 'interest', or 'general'."
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
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> List[UserMemory]:
        """Fetch all long-term memories stored for a user with category filtering and search."""
        stmt = select(UserMemory).where(UserMemory.user_id == user_id)

        if category and category.lower() != "all":
            norm_cat = category.strip().lower().replace(" ", "_")
            stmt = stmt.where(UserMemory.category.ilike(f"%{norm_cat}%"))

        if search and search.strip():
            stmt = stmt.where(UserMemory.memory_text.ilike(f"%{search.strip()}%"))

        stmt = stmt.order_by(UserMemory.created_at.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_memory(
        db: AsyncSession,
        memory_id: UUID,
        user_id: UUID,
        memory_text: Optional[str] = None,
        category: Optional[str] = None,
        confidence_score: Optional[float] = None,
    ) -> UserMemory:
        """Update a long-term memory entry, re-generating embeddings if text changed."""
        stmt = select(UserMemory).where(
            UserMemory.id == memory_id,
            UserMemory.user_id == user_id,
        )
        result = await db.execute(stmt)
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory entry not found")

        if memory_text is not None:
            clean_text = memory_text.strip()
            if not clean_text:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Memory text cannot be empty")
            memory.memory_text = clean_text
            memory.embedding = get_text_embedding(clean_text)

        if category is not None:
            memory.category = category.strip().lower().replace(" ", "_")

        if confidence_score is not None:
            memory.confidence_score = max(0.0, min(1.0, float(confidence_score)))

        memory.updated_at = utc_now()
        await db.commit()
        await db.refresh(memory)
        return memory

    @staticmethod
    async def get_knowledge_graph(
        db: AsyncSession,
        user_id: UUID,
    ) -> Dict[str, Any]:
        """
        Build an interactive Personal Knowledge Graph linking:
        - Central user entity
        - Learned concepts/facts categorized by interests, tech preferences, projects, coding conventions
        - Uploaded documents (PDF, DOCX, transcripts)
        - Chat threads
        - Semantic and cross-entity relational edges
        """
        # Fetch user details
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user_obj = user_result.scalar_one_or_none()
        user_email = user_obj.email if user_obj else "User"
        user_name = user_email.split("@")[0] if "@" in user_email else user_email

        # Fetch memories
        mem_stmt = (
            select(UserMemory)
            .where(UserMemory.user_id == user_id)
            .order_by(UserMemory.created_at.desc())
        )
        mem_res = await db.execute(mem_stmt)
        memories = list(mem_res.scalars().all())

        # Fetch uploaded documents
        doc_stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
        )
        doc_res = await db.execute(doc_stmt)
        documents = list(doc_res.scalars().all())

        # Fetch conversations
        conv_stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(25)
        )
        conv_res = await db.execute(conv_stmt)
        conversations = list(conv_res.scalars().all())

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # 1. Central User Node
        user_node_id = f"user-{user_id}"
        nodes.append({
            "id": user_node_id,
            "label": f"You ({user_name})",
            "type": "user",
            "category": "user",
            "data": {
                "id": str(user_id),
                "name": user_name,
                "email": user_email,
                "memoriesCount": len(memories),
                "documentsCount": len(documents),
                "threadsCount": len(conversations),
            },
        })

        # 2. Concept / Memory Nodes
        mem_tokens: Dict[UUID, set[str]] = {}
        for mem in memories:
            cat = (mem.category or "general").lower().replace(" ", "_")
            tokens = extract_meaningful_tokens(mem.memory_text)
            mem_tokens[mem.id] = tokens

            display_label = mem.memory_text
            if len(display_label) > 48:
                display_label = display_label[:45] + "..."

            node_id = f"mem-{mem.id}"
            nodes.append({
                "id": node_id,
                "label": display_label,
                "type": "concept",
                "category": cat,
                "data": {
                    "id": str(mem.id),
                    "full_text": mem.memory_text,
                    "category": cat,
                    "confidence": mem.confidence_score,
                    "created_at": mem.created_at.isoformat(),
                },
            })

            # Base edge from User to Concept
            edges.append({
                "id": f"e-user-mem-{mem.id}",
                "source": user_node_id,
                "target": node_id,
                "label": "knows",
                "relationship": "user_concept",
            })

        # 3. Document Nodes
        doc_tokens: Dict[UUID, set[str]] = {}
        for doc in documents:
            tokens = extract_meaningful_tokens(doc.filename)
            doc_tokens[doc.id] = tokens

            node_id = f"doc-{doc.id}"
            nodes.append({
                "id": node_id,
                "label": doc.filename,
                "type": "document",
                "category": "document",
                "data": {
                    "id": str(doc.id),
                    "filename": doc.filename,
                    "file_type": doc.file_type,
                    "file_size": doc.file_size_bytes,
                    "total_pages": doc.total_pages,
                    "total_chunks": doc.total_chunks,
                    "created_at": doc.created_at.isoformat(),
                },
            })

            # Base edge from User to Document
            edges.append({
                "id": f"e-user-doc-{doc.id}",
                "source": user_node_id,
                "target": node_id,
                "label": "uploaded",
                "relationship": "user_doc",
            })

        # 4. Chat Thread Nodes
        conv_tokens: Dict[UUID, set[str]] = {}
        for conv in conversations:
            tokens = extract_meaningful_tokens(conv.title)
            conv_tokens[conv.id] = tokens

            node_id = f"thread-{conv.id}"
            display_title = conv.title
            if len(display_title) > 42:
                display_title = display_title[:39] + "..."

            nodes.append({
                "id": node_id,
                "label": display_title,
                "type": "thread",
                "category": "thread",
                "data": {
                    "id": str(conv.id),
                    "title": conv.title,
                    "is_pinned": conv.is_pinned,
                    "created_at": conv.created_at.isoformat(),
                    "updated_at": conv.updated_at.isoformat(),
                },
            })

            # Base edge from User to Chat Thread
            edges.append({
                "id": f"e-user-thread-{conv.id}",
                "source": user_node_id,
                "target": node_id,
                "label": "chatted",
                "relationship": "user_thread",
            })

        # 5. Semantic Cross-Links: Documents <-> Concepts
        for doc in documents:
            dtoks = doc_tokens.get(doc.id, set())
            for mem in memories:
                mtoks = mem_tokens.get(mem.id, set())
                common = dtoks.intersection(mtoks)
                if common:
                    sample = list(common)[:2]
                    edges.append({
                        "id": f"e-doc-{doc.id}-mem-{mem.id}",
                        "source": f"doc-{doc.id}",
                        "target": f"mem-{mem.id}",
                        "label": f"relates ({', '.join(sample)})",
                        "relationship": "doc_concept",
                    })

        # 6. Semantic Cross-Links: Chat Threads <-> Concepts
        for conv in conversations:
            ctoks = conv_tokens.get(conv.id, set())
            for mem in memories:
                mtoks = mem_tokens.get(mem.id, set())
                common = ctoks.intersection(mtoks)
                if common:
                    sample = list(common)[:2]
                    edges.append({
                        "id": f"e-thread-{conv.id}-mem-{mem.id}",
                        "source": f"thread-{conv.id}",
                        "target": f"mem-{mem.id}",
                        "label": f"discussed ({', '.join(sample)})",
                        "relationship": "thread_concept",
                    })

        # 7. Semantic Cross-Links: Chat Threads <-> Documents
        for conv in conversations:
            ctoks = conv_tokens.get(conv.id, set())
            for doc in documents:
                dtoks = doc_tokens.get(doc.id, set())
                common = ctoks.intersection(dtoks)
                if common:
                    edges.append({
                        "id": f"e-thread-{conv.id}-doc-{doc.id}",
                        "source": f"thread-{conv.id}",
                        "target": f"doc-{doc.id}",
                        "label": "references",
                        "relationship": "thread_doc",
                    })

        # 8. Inter-concept associations (same category or >= 2 shared tokens)
        for i, m1 in enumerate(memories):
            t1 = mem_tokens.get(m1.id, set())
            cat1 = (m1.category or "general").lower()
            for m2 in memories[i + 1:]:
                t2 = mem_tokens.get(m2.id, set())
                cat2 = (m2.category or "general").lower()
                common = t1.intersection(t2)
                if len(common) >= 2 or (cat1 != "general" and cat1 == cat2 and common):
                    edges.append({
                        "id": f"e-mem-{m1.id}-mem-{m2.id}",
                        "source": f"mem-{m1.id}",
                        "target": f"mem-{m2.id}",
                        "label": "related",
                        "relationship": "concept_concept",
                    })

        stats = {
            "total_memories": len(memories),
            "tech_preferences": sum(1 for m in memories if "tech" in (m.category or "").lower()),
            "coding_conventions": sum(
                1 for m in memories if "convention" in (m.category or "").lower() or "coding" in (m.category or "").lower()
            ),
            "projects": sum(1 for m in memories if "project" in (m.category or "").lower()),
            "interests": sum(1 for m in memories if "interest" in (m.category or "").lower()),
            "documents": len(documents),
            "threads": len(conversations),
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
        }

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
                "You are an expert user-preference and knowledge extraction engine for an AI assistant.\n"
                "Analyze the user message and extract durable facts about the user across these 4 key categories:\n"
                "1. 'tech_preference' (e.g. programming languages, frameworks, libraries, tools like Next.js, FastAPI, PostgreSQL, Tailwind)\n"
                "2. 'coding_convention' (e.g. preferred design patterns, typing rules, testing habits, architectural styles)\n"
                "3. 'project' (e.g. projects the user is building, current applications, milestones, client work)\n"
                "4. 'interest' (e.g. areas of curiosity, domains like AI/ML, distributed systems, web dev)\n"
                "5. 'general' (e.g. general personal preferences, communication styles, timezone)\n\n"
                "CRITICAL RULES:\n"
                "1. Only extract persistent, reusable preferences, conventions, projects, or facts about the user.\n"
                "2. Do NOT extract ephemeral requests, one-time questions, bug reports, or task instructions.\n"
                "3. Format each extracted memory as a concise, third-person declarative statement starting with 'User...' (e.g., 'User prefers TypeScript with Next.js App Router').\n"
                "4. Assign the appropriate category: 'tech_preference', 'coding_convention', 'project', 'interest', or 'general'.\n"
                "5. If no durable preferences or facts are mentioned, return an empty list.\n\n"
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

