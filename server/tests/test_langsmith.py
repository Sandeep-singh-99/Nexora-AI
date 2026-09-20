import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings, configure_langsmith
from app.ai.core.langsmith import get_langsmith_client, check_langsmith_connection


def test_langsmith_config():
    """Verifies that LangSmith settings are loaded and synchronized to os.environ."""
    configure_langsmith()

    assert settings.LANGSMITH_API_KEY != ""
    assert settings.LANGSMITH_TRACING is True
    assert settings.LANGSMITH_PROJECT == "Nexora"

    assert os.environ.get("LANGSMITH_TRACING") == "true"
    assert os.environ.get("LANGCHAIN_TRACING_V2") == "true"
    assert os.environ.get("LANGSMITH_API_KEY") == settings.LANGSMITH_API_KEY
    assert os.environ.get("LANGCHAIN_API_KEY") == settings.LANGSMITH_API_KEY
    assert os.environ.get("LANGSMITH_PROJECT") == "Nexora"
    assert os.environ.get("LANGCHAIN_PROJECT") == "Nexora"


def test_langsmith_client_initialization():
    """Verifies that LangSmith client initializes properly."""
    client = get_langsmith_client()
    assert client is not None
    assert "smith.langchain.com" in client.api_url


def test_langsmith_connection():
    """Verifies connection to LangSmith platform."""
    result = check_langsmith_connection()
    assert result["enabled"] is True
    assert result["connected"] is True
    assert result["project"] == "Nexora"


@pytest.mark.asyncio
async def test_langsmith_status_endpoint():
    """Verifies that the /api/v1/langsmith/status endpoint returns valid status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/ai/langsmith/status")
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert data["project"] == "Nexora"
