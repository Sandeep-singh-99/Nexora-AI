import uuid
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from uuid import UUID

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.ai.rag.loaders import DocumentItem

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunkItem:
    """Represents an individual chunk ready to be embedded and stored."""
    content: str
    chunk_index: int
    page_number: Optional[int]
    document_id: UUID
    user_id: UUID
    metadata: Dict[str, Any] = field(default_factory=dict)


def chunk_document_items(
    items: List[DocumentItem],
    document_id: UUID,
    user_id: UUID,
    filename: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[DocumentChunkItem]:
    """
    Chunks extracted document items using RecursiveCharacterTextSplitter while
    preserving and enriching metadata like page number, filename, chunk index, user_id, and document_id.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: List[DocumentChunkItem] = []
    global_index = 0

    for item in items:
        page_num = item.page_number
        text = item.content.strip()
        if not text:
            continue

        raw_splits = splitter.split_text(text)
        for split_text in raw_splits:
            cleaned_split = split_text.strip()
            if not cleaned_split:
                continue

            chunk_meta = {
                "filename": filename,
                "document_id": str(document_id),
                "user_id": str(user_id),
                "page_number": page_num,
                "chunk_index": global_index,
                **(item.metadata or {}),
            }

            chunks.append(
                DocumentChunkItem(
                    content=cleaned_split,
                    chunk_index=global_index,
                    page_number=page_num,
                    document_id=document_id,
                    user_id=user_id,
                    metadata=chunk_meta,
                )
            )
            global_index += 1

    # Update total_chunks in each chunk's metadata
    total_count = len(chunks)
    for c in chunks:
        c.metadata["total_chunks"] = total_count

    logger.debug(f"Chunked '{filename}' into {total_count} chunks.")
    return chunks
