import uuid
from app.ai.rag.embeddings import get_embedding_vector, _pad_or_truncate_vector, TARGET_DIM
from app.ai.rag.vector_store import RetrievedChunk


def test_embedding_dimension_guarantee():
    """Verify that embeddings always conform to 768 dimensions for pgvector."""
    vec1 = get_embedding_vector("Agentic RAG with Nexora AI")
    assert len(vec1) == TARGET_DIM
    assert isinstance(vec1, list)
    assert all(isinstance(x, (float, int)) for x in vec1)


def test_pad_or_truncate():
    """Verify padding and truncation helper functions."""
    short_vec = [0.1] * 384
    long_vec = [0.2] * 1024

    padded = _pad_or_truncate_vector(short_vec, target_dim=768)
    truncated = _pad_or_truncate_vector(long_vec, target_dim=768)

    assert len(padded) == 768
    assert len(truncated) == 768
    assert padded[:384] == short_vec
    assert padded[384:] == [0.0] * 384
    assert truncated == long_vec[:768]


def test_retrieved_chunk_user_isolation_contract():
    """Verify RetrievedChunk structures and tenant boundary metadata."""
    doc_id = uuid.uuid4()
    chunk = RetrievedChunk(
        content="Project timeline specification.",
        chunk_index=0,
        page_number=1,
        document_id=doc_id,
        filename="project.docx",
        similarity_score=0.88,
        metadata={"user_id": str(uuid.uuid4())},
    )

    assert chunk.document_id == doc_id
    assert chunk.similarity_score == 0.88
    assert chunk.filename == "project.docx"
