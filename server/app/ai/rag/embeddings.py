import asyncio
import hashlib
import logging
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_model = None
TARGET_DIM = 768


class GeminiQuotaExceededError(Exception):
    """Raised when Google Gemini embedding token quota or rate limit is exceeded."""
    def __init__(self, message: str = "Google Gemini embedding token quota exceeded. Please wait a moment or check your Gemini API quota."):
        super().__init__(message)
        self.message = message


def is_gemini_quota_error(err: Exception) -> bool:
    """Detects whether an exception represents a Google Gemini 429 / quota / rate limit error."""
    err_str = str(err).lower()
    return (
        "resource_exhausted" in err_str
        or "429" in err_str
        or "quota" in err_str
        or "rate_limit" in err_str
        or "rate limit" in err_str
        or "tokens per minute" in err_str
        or "requests per minute" in err_str
    )


def _get_or_create_model():
    """Lazily load Google Gemini embeddings model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from app.ai.core.embedding import get_embeddings
            _embedding_model = get_embeddings()
        except Exception as err:
            logger.error(f"Failed to initialize Google Gemini embedding model: {err}")
            _embedding_model = None
    return _embedding_model


def _pad_or_truncate_vector(vector: List[float], target_dim: int = TARGET_DIM) -> List[float]:
    """Ensures vector matches exact required dimension for pgvector."""
    if len(vector) < target_dim:
        return vector + [0.0] * (target_dim - len(vector))
    elif len(vector) > target_dim:
        return vector[:target_dim]
    return vector


def _generate_fallback_vector(text: str, target_dim: int = TARGET_DIM) -> List[float]:
    """Deterministic fallback pseudo-vector if embedding model is unavailable."""
    hash_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    fallback = [((b / 255.0) - 0.5) for b in hash_bytes]
    full_fallback = (fallback * (target_dim // len(fallback) + 1))[:target_dim]
    return full_fallback


def get_embedding_vector(text: str) -> List[float]:
    """Generates a 768-dimensional float vector embedding for single text string using Google Gemini."""
    clean_text = text.strip() if text else ""
    if not clean_text:
        return [0.0] * TARGET_DIM

    model = _get_or_create_model()
    if model is not None:
        try:
            if hasattr(model, "embed_query"):
                raw_vec = model.embed_query(clean_text)
            else:
                raw_vec = model.encode(clean_text).tolist()
            return _pad_or_truncate_vector(raw_vec)
        except Exception as e:
            if is_gemini_quota_error(e):
                logger.error(f"Google Gemini embedding token quota exceeded: {e}")
                raise GeminiQuotaExceededError(f"Google Gemini embedding token quota exceeded: {e}") from e
            logger.warning(f"Error computing embedding: {e}; using fallback vector.")

    return _generate_fallback_vector(clean_text)


def get_batch_embedding_vectors(texts: List[str]) -> List[List[float]]:
    """Generates 768-dimensional float vector embeddings for a list of texts in batch using Google Gemini."""
    if not texts:
        return []

    model = _get_or_create_model()
    if model is not None:
        try:
            # Batch encode for high efficiency
            if hasattr(model, "embed_documents"):
                raw_vectors = model.embed_documents(texts)
            else:
                raw_vectors = model.encode(texts, show_progress_bar=False).tolist()
            return [_pad_or_truncate_vector(v) for v in raw_vectors]
        except Exception as e:
            if is_gemini_quota_error(e):
                logger.error(f"Google Gemini embedding token quota exceeded: {e}")
                raise GeminiQuotaExceededError(f"Google Gemini embedding token quota exceeded: {e}") from e
            logger.warning(f"Error computing batch embeddings: {e}; falling back to individual generation.")

    return [get_embedding_vector(t) for t in texts]


async def aget_embedding_vector(text: str) -> List[float]:
    """Async wrapper that offloads embedding computation to worker thread."""
    return await asyncio.to_thread(get_embedding_vector, text)


async def aget_batch_embedding_vectors(texts: List[str]) -> List[List[float]]:
    """Async wrapper that offloads batch embedding computation to worker thread."""
    return await asyncio.to_thread(get_batch_embedding_vectors, texts)
