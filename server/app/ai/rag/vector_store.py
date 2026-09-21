import uuid
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk
from app.ai.rag.loaders import load_document
from app.ai.rag.chunking import chunk_document_items
from app.ai.rag.embeddings import aget_embedding_vector, aget_batch_embedding_vectors

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """Represents a retrieved document chunk with relevance scoring."""
    content: str
    chunk_index: int
    page_number: Optional[int]
    document_id: UUID
    filename: str
    similarity_score: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class DocumentVectorStore:
    """
    Manages document chunk storage, multi-tenant isolation, and semantic similarity search
    using PostgreSQL + pgvector.
    """

    @staticmethod
    async def ingest_document(
        db: AsyncSession,
        user_id: UUID,
        filename: str,
        file_bytes: bytes,
    ) -> Document:
        """
        Ingests a PDF or DOCX file completely in memory:
        1. Extracts text items (pages/sections) in-memory.
        2. Chunks text with metadata.
        3. Generates 768-dim vector embeddings in batch.
        4. Saves Document metadata and DocumentChunk records into pgvector.
        Never writes or saves the raw original file to disk.
        """
        # Step 1: In-memory parsing
        try:
            items = load_document(filename, file_bytes)
        except Exception as e:
            logger.error(f"Failed to parse document '{filename}': {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse document '{filename}': {str(e)}",
            )

        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document '{filename}' contains no readable content.",
            )

        doc_id = uuid.uuid4()
        file_type = "pdf" if filename.lower().endswith(".pdf") else "docx"
        total_pages = max(item.page_number for item in items) if items else 1

        # Step 2: In-memory chunking
        chunk_items = chunk_document_items(
            items=items,
            document_id=doc_id,
            user_id=user_id,
            filename=filename,
        )

        if not chunk_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No text chunks could be created from document '{filename}'.",
            )

        # Step 3: Generate batch embeddings
        texts_to_embed = [c.content for c in chunk_items]
        embeddings = await aget_batch_embedding_vectors(texts_to_embed)

        # Step 4: Persist metadata and chunks in DB
        doc_record = Document(
            id=doc_id,
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            file_size_bytes=len(file_bytes),
            total_pages=total_pages,
            total_chunks=len(chunk_items),
        )
        db.add(doc_record)

        for chunk_item, emb in zip(chunk_items, embeddings):
            chunk_record = DocumentChunk(
                document_id=doc_id,
                user_id=user_id,
                content=chunk_item.content,
                chunk_index=chunk_item.chunk_index,
                page_number=chunk_item.page_number,
                extra_metadata=chunk_item.metadata,
                embedding=emb,
            )
            db.add(chunk_record)

        await db.commit()
        await db.refresh(doc_record)

        logger.info(
            f"Successfully ingested document '{filename}' (ID: {doc_id}) "
            f"for user {user_id} with {len(chunk_items)} chunks."
        )
        return doc_record

    @staticmethod
    async def similarity_search(
        db: AsyncSession,
        user_id: UUID,
        query: str,
        limit: int = 5,
        document_id: Optional[UUID] = None,
        threshold: float = 0.0,
    ) -> List[RetrievedChunk]:
        """
        Executes pgvector cosine distance similarity search with strict multi-tenant isolation.
        Always filters by DocumentChunk.user_id == user_id.
        Optionally filters by DocumentChunk.document_id == document_id.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        query_vector = await aget_embedding_vector(clean_query)

        # Calculate cosine distance
        cosine_dist = DocumentChunk.embedding.cosine_distance(query_vector)

        stmt = (
            select(
                DocumentChunk,
                cosine_dist.label("distance"),
                Document.filename,
            )
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(DocumentChunk.user_id == user_id)
        )

        if document_id:
            stmt = stmt.where(DocumentChunk.document_id == document_id)

        stmt = stmt.order_by("distance").limit(limit)

        result = await db.execute(stmt)
        rows = result.all()

        retrieved: List[RetrievedChunk] = []
        for chunk, distance, filename in rows:
            # Cosine similarity is 1.0 - cosine_distance
            sim_score = max(0.0, 1.0 - float(distance))
            if sim_score >= threshold:
                retrieved.append(
                    RetrievedChunk(
                        content=chunk.content,
                        chunk_index=chunk.chunk_index,
                        page_number=chunk.page_number,
                        document_id=chunk.document_id,
                        filename=filename or (chunk.extra_metadata or {}).get("filename", "Unknown Document"),
                        similarity_score=sim_score,
                        metadata=chunk.extra_metadata or {},
                    )
                )

        return retrieved

    @staticmethod
    async def get_user_documents(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Document]:
        """Fetches list of all ingested documents owned by user."""
        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_document_by_id(
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[Document]:
        """Fetches document metadata ensuring strict ownership."""
        stmt = select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_document(
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> bool:
        """Deletes a document and cascades deletion of all its pgvector chunks."""
        doc = await DocumentVectorStore.get_document_by_id(db, user_id, document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied.",
            )

        await db.delete(doc)
        await db.commit()
        logger.info(f"Deleted document {document_id} and associated chunks for user {user_id}.")
        return True
