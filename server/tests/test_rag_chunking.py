import uuid
from app.ai.rag.loaders import DocumentItem
from app.ai.rag.chunking import chunk_document_items


def test_chunking_metadata_preservation():
    """Verify chunking accurately assigns indices, page numbers, and isolation IDs."""
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()
    filename = "terms_of_service.docx"

    # Create document items representing multiple pages
    long_paragraph = "Nexora Agentic RAG enables intelligent search. " * 30  # ~1400 chars
    items = [
        DocumentItem(content=long_paragraph, page_number=1, metadata={"file_type": "docx"}),
        DocumentItem(content="Page 2 specific terms and conditions content.", page_number=2, metadata={"file_type": "docx"}),
    ]

    chunks = chunk_document_items(
        items=items,
        document_id=doc_id,
        user_id=user_id,
        filename=filename,
        chunk_size=500,
        chunk_overlap=50,
    )

    assert len(chunks) >= 3  # Long paragraph split into multiple chunks + page 2
    # Verify metadata on all chunks
    for idx, chunk in enumerate(chunks):
        assert chunk.chunk_index == idx
        assert chunk.document_id == doc_id
        assert chunk.user_id == user_id
        assert chunk.metadata["filename"] == filename
        assert chunk.metadata["total_chunks"] == len(chunks)
        assert chunk.page_number in (1, 2)
        assert len(chunk.content) > 0


def test_chunking_empty_items():
    """Verify chunking safely handles empty or whitespace-only items."""
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()

    items = [
        DocumentItem(content="   ", page_number=1),
        DocumentItem(content="", page_number=2),
    ]

    chunks = chunk_document_items(
        items=items,
        document_id=doc_id,
        user_id=user_id,
        filename="empty.pdf",
    )

    assert len(chunks) == 0
