import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    file_size_bytes: int
    total_pages: int
    total_chunks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]


class DocumentChunkResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    chunk_index: int
    page_number: Optional[int] = None
    content: str
    metadata: Optional[Dict[str, Any]] = None
    similarity_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="User question to answer from documents")
    document_id: Optional[uuid.UUID] = Field(None, description="Optional document ID to restrict search to a single document")


class DocumentQueryResponse(BaseModel):
    query: str
    answer: str
    is_grounded: bool = True
    sources: List[Dict[str, Any]] = Field(default_factory=list)


class YouTubeIngestRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500, description="YouTube Video URL or Video ID")


class YouTubeSnippetResponse(BaseModel):
    text: str
    start: float
    duration: float
    timestamp: str


class YouTubeDocumentResponse(DocumentResponse):
    video_id: str
    url: str
    title: str
    author_name: str
    thumbnail_url: str
    snippets: List[YouTubeSnippetResponse] = Field(default_factory=list)
