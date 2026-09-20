import logging
import os
from typing import Optional, Dict, Any
from langsmith import Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_langsmith_client() -> Optional[Client]:
    """Returns a singleton instance of LangSmith client if configured."""
    global _client
    if not settings.LANGSMITH_API_KEY:
        return None

    if _client is None:
        try:
            _client = Client(
                api_key=settings.LANGSMITH_API_KEY,
                api_url=settings.LANGSMITH_ENDPOINT or "https://api.smith.langchain.com",
            )
        except Exception as e:
            logger.warning("Failed to initialize LangSmith client: %s", e)
            return None
    return _client


def check_langsmith_connection() -> Dict[str, Any]:
    """Verifies LangSmith configuration and validates connection with the LangSmith API."""
    if not settings.LANGSMITH_API_KEY:
        return {
            "enabled": False,
            "connected": False,
            "project": settings.LANGSMITH_PROJECT,
            "endpoint": settings.LANGSMITH_ENDPOINT,
            "message": "LANGSMITH_API_KEY is not configured.",
        }

    try:
        client = get_langsmith_client()
        if client is None:
            return {
                "enabled": settings.LANGSMITH_TRACING,
                "connected": False,
                "project": settings.LANGSMITH_PROJECT,
                "endpoint": settings.LANGSMITH_ENDPOINT,
                "error": "Could not instantiate LangSmith client.",
            }

        # Validate connectivity by checking project access
        # list_projects returns a generator
        list(client.list_projects(limit=1))

        return {
            "enabled": settings.LANGSMITH_TRACING,
            "connected": True,
            "project": settings.LANGSMITH_PROJECT,
            "endpoint": settings.LANGSMITH_ENDPOINT,
            "message": "LangSmith connected and tracing is active.",
        }
    except Exception as e:
        logger.warning("LangSmith connection verification failed: %s", e)
        return {
            "enabled": settings.LANGSMITH_TRACING,
            "connected": False,
            "project": settings.LANGSMITH_PROJECT,
            "endpoint": settings.LANGSMITH_ENDPOINT,
            "error": str(e),
        }
