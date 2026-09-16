import pytest
import uuid
from app.services.memory_service import get_text_embedding


def test_get_text_embedding_dimensions():
    """Verify that embedding vector generator always returns 768 float dimensions."""
    text = "User prefers writing FastAPI backend code in Python."
    vec = get_text_embedding(text)
    assert isinstance(vec, list)
    assert len(vec) == 768
    assert all(isinstance(x, float) for x in vec)


def test_get_text_embedding_fallback():
    """Verify embedding generator works gracefully on empty string or special characters."""
    vec1 = get_text_embedding("")
    vec2 = get_text_embedding("🚀 Nexora AI long term memory testing!")
    assert len(vec1) == 768
    assert len(vec2) == 768
