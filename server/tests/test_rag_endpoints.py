import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.models.document import Document
from tests.test_rag_loaders import create_in_memory_docx


@pytest.fixture
def mock_user():
    return User(
        id=uuid.UUID("12345678-1234-5678-1234-567812345678"),
        email="testuser@nexora.ai",
        is_active=True,
        is_verified=True,
    )


@pytest.mark.asyncio
async def test_upload_invalid_extension(mock_user):
    """Verify upload rejects unsupported file formats."""
    app.dependency_overrides[get_current_user] = lambda: mock_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("malicious.exe", b"executable bytes", "application/octet-stream")},
        )
        assert response.status_code == 400
        assert "Unsupported file format" in response.json()["detail"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_empty_file(mock_user):
    """Verify upload rejects empty files."""
    app.dependency_overrides[get_current_user] = lambda: mock_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        assert response.status_code == 400
        assert "Uploaded file is empty" in response.json()["detail"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_direct_query_endpoint(mock_user):
    """Verify /api/v1/documents/query triggers Agentic RAG and returns grounded answer."""
    app.dependency_overrides[get_current_user] = lambda: mock_user

    mock_rag = {
        "query": "What are the specs?",
        "answer": "According to [spec.docx, Page 1], the system is agentic.",
        "sources": [{"filename": "spec.docx", "page_number": 1}],
        "is_grounded": True,
    }

    with patch("app.api.v1.endpoints.documents.run_agentic_rag", new=AsyncMock(return_value=mock_rag)):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/documents/query",
                json={"query": "What are the specs?"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["is_grounded"] is True
            assert "According to [spec.docx, Page 1]" in data["answer"]
            assert len(data["sources"]) == 1

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_sensitive_data_triggers_guardrail_409(mock_user):
    """Verify document upload intercepts sensitive data and returns 409 with findings."""
    app.dependency_overrides[get_current_user] = lambda: mock_user

    docx_bytes = create_in_memory_docx("Confidential client credit card number: 4111111111111234 on record.")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("billing.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        assert response.status_code == 409
        detail = response.json()["detail"]
        assert detail["error_code"] == "SENSITIVE_DATA_DETECTED"
        assert detail["filename"] == "billing.docx"
        assert len(detail["findings"]) >= 1
        assert detail["findings"][0]["category"] == "Credit Card"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_sensitive_data_proceeds_with_confirmation(mock_user):
    """Verify document upload proceeds to ingestion when user confirms proceed with sensitive data."""
    app.dependency_overrides[get_current_user] = lambda: mock_user

    docx_bytes = create_in_memory_docx("Employee credentials: SSN 123-45-6789.")
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    mock_doc = Document(
        id=uuid.uuid4(),
        user_id=mock_user.id,
        filename="employee.docx",
        file_type="docx",
        file_size_bytes=len(docx_bytes),
        total_pages=1,
        total_chunks=1,
        created_at=now,
    )

    with patch("app.api.v1.endpoints.documents.DocumentVectorStore.ingest_document", new=AsyncMock(return_value=mock_doc)):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/documents/upload",
                files={"file": ("employee.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                data={"confirm_sensitive": "true"},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["filename"] == "employee.docx"

    app.dependency_overrides.clear()
