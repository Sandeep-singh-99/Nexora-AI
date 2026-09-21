import uuid
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentQueryRequest,
    DocumentQueryResponse,
)
from app.ai.rag.vector_store import DocumentVectorStore
from app.ai.rag.rag_agent import run_agentic_rag

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Documents & RAG"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB max



@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and ingest a document (PDF or DOCX) into the vector database.
    - Zero permanent storage: Document is processed in memory only.
    - Chunks and embeddings are stored in pgvector.
    - Strictly isolated to the authenticated user.
    """
    filename = file.filename or "uploaded_document"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF (.pdf) and Word (.docx) files are supported.",
        )

    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(content_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    try:
        doc = await DocumentVectorStore.ingest_document(
            db=db,
            user_id=current_user.id,
            filename=filename,
            file_bytes=content_bytes,
        )
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error ingesting document '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}",
        )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all ingested documents belonging to the authenticated user."""
    docs = await DocumentVectorStore.get_user_documents(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    return DocumentListResponse(documents=docs)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve metadata of a specific uploaded document owned by the user."""
    doc = await DocumentVectorStore.get_document_by_id(
        db=db,
        user_id=current_user.id,
        document_id=document_id,
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and permanently remove all its vector embeddings and chunks."""
    await DocumentVectorStore.delete_document(
        db=db,
        user_id=current_user.id,
        document_id=document_id,
    )
    return None


@router.post("/query", response_model=DocumentQueryResponse)
async def query_documents(
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Directly query user documents using the Agentic RAG engine.
    - Evaluates retrieval sufficiency.
    - Re-retrieves with refined query if needed.
    - Generates grounded response with citations.
    """
    doc_id_str = str(payload.document_id) if payload.document_id else None
    result = await run_agentic_rag(
        query=payload.query,
        user_id=str(current_user.id),
        document_id=doc_id_str,
    )

    return DocumentQueryResponse(
        query=payload.query,
        answer=result.get("answer", ""),
        is_grounded=result.get("is_grounded", False),
        sources=result.get("sources", []),
    )
