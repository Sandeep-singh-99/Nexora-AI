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
from app.ai.rag.youtube_loader import fetch_youtube_video_data, YouTubeVideoData

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
    async def ingest_youtube_video(
        db: AsyncSession,
        user_id: UUID,
        url: str,
    ) -> tuple[Document, YouTubeVideoData]:
        """
        Ingests a YouTube video transcript into pgvector:
        1. Fetches metadata and timestamped transcript snippets via youtube_transcript_api & oEmbed.
        2. Chunks transcript with start/end timestamps and URLs.
        3. Generates 768-dim vector embeddings in batch.
        4. Saves Document metadata (file_type='youtube') and DocumentChunk records.
        """
        try:
            yt_data = await fetch_youtube_video_data(url)
        except Exception as e:
            logger.error(f"Failed to fetch YouTube video transcript for '{url}': {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

        if not yt_data.chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No transcript chunks could be generated for YouTube video '{yt_data.title}'.",
            )

        doc_id = uuid.uuid4()
        texts_to_embed = [c.content for c in yt_data.chunks]
        embeddings = await aget_batch_embedding_vectors(texts_to_embed)

        filename = f"YouTube: {yt_data.title}"
        doc_record = Document(
            id=doc_id,
            user_id=user_id,
            filename=filename[:250],
            file_type="youtube",
            file_size_bytes=len(yt_data.full_text.encode("utf-8")),
            total_pages=1,
            total_chunks=len(yt_data.chunks),
        )
        db.add(doc_record)

        snippets_dict_list = [
            {
                "text": s.text,
                "start": s.start,
                "duration": s.duration,
                "timestamp": s.timestamp,
            }
            for s in yt_data.snippets
        ]

        for idx, (chunk_item, emb) in enumerate(zip(yt_data.chunks, embeddings)):
            chunk_meta = dict(chunk_item.metadata)
            chunk_meta["document_id"] = str(doc_id)
            chunk_meta["user_id"] = str(user_id)
            if idx == 0:
                chunk_meta["snippets"] = snippets_dict_list

            chunk_record = DocumentChunk(
                document_id=doc_id,
                user_id=user_id,
                content=chunk_item.content,
                chunk_index=chunk_item.chunk_index,
                page_number=1,
                extra_metadata=chunk_meta,
                embedding=emb,
            )
            db.add(chunk_record)

        await db.commit()
        await db.refresh(doc_record)

        logger.info(
            f"Successfully ingested YouTube video '{yt_data.title}' (ID: {doc_id}) "
            f"for user {user_id} with {len(yt_data.chunks)} chunks."
        )
        return doc_record, yt_data

    @staticmethod
    async def get_youtube_video_details(
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[Dict[str, Any]]:
        """Retrieves YouTube video metadata and transcript snippets for interactive playback."""
        doc = await DocumentVectorStore.get_document_by_id(db, user_id, document_id)
        if not doc or doc.file_type != "youtube":
            return None

        stmt = (
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document_id,
                DocumentChunk.user_id == user_id,
                DocumentChunk.chunk_index == 0,
            )
        )
        res = await db.execute(stmt)
        chunk = res.scalar_one_or_none()
        meta = (chunk.extra_metadata or {}) if chunk else {}

        return {
            "document": doc,
            "video_id": meta.get("video_id", ""),
            "url": meta.get("url", ""),
            "title": meta.get("title", doc.filename),
            "author_name": meta.get("author_name", "YouTube"),
            "thumbnail_url": meta.get("thumbnail_url", ""),
            "snippets": meta.get("snippets", []),
        }

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

        # If document_id not specified, check if user has exactly one document
        if not document_id:
            user_docs = await DocumentVectorStore.get_user_documents(db, user_id, limit=2)
            if len(user_docs) == 1:
                document_id = user_docs[0].id

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

        # Check for overview/summary/context meta-questions
        overview_triggers = [
            "summarize",
            "summary",
            "overview",
            "context",
            "content",
            "what is this",
            "about this",
            "about the pdf",
            "about the document",
            "outline",
            "tell me about",
            "name",
            "explain this",
            "key points",
        ]
        q_lower = clean_query.lower()
        is_overview_request = any(t in q_lower for t in overview_triggers)

        # If overview request or if vector similarity produced no chunks, fetch introductory chunks
        if is_overview_request or len(retrieved) == 0:
            target_id = document_id
            if not target_id:
                latest_docs = await DocumentVectorStore.get_user_documents(db, user_id, limit=1)
                if latest_docs:
                    target_id = latest_docs[0].id

            if target_id:
                intro_limit = max(limit, 8) if is_overview_request else limit
                intro_stmt = (
                    select(DocumentChunk, Document.filename)
                    .join(Document, Document.id == DocumentChunk.document_id)
                    .where(
                        DocumentChunk.user_id == user_id,
                        DocumentChunk.document_id == target_id,
                    )
                    .order_by(DocumentChunk.chunk_index)
                    .limit(intro_limit)
                )
                intro_res = await db.execute(intro_stmt)
                intro_rows = intro_res.all()

                for chunk, filename in intro_rows:
                    if not any(r.content == chunk.content for r in retrieved):
                        retrieved.append(
                            RetrievedChunk(
                                content=chunk.content,
                                chunk_index=chunk.chunk_index,
                                page_number=chunk.page_number,
                                document_id=chunk.document_id,
                                filename=filename or (chunk.extra_metadata or {}).get("filename", "Document"),
                                similarity_score=0.88,
                                metadata=chunk.extra_metadata or {},
                            )
                        )

        # Guarantee strict scoping: if document_id was requested, NEVER return chunks from other documents
        if document_id:
            retrieved = [c for c in retrieved if str(c.document_id) == str(document_id)]

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
