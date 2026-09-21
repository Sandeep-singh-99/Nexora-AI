import pytest
from unittest.mock import AsyncMock, patch
from app.ai.tool.rag_tool import search_user_documents


@pytest.mark.asyncio
async def test_search_user_documents_anonymous_rejected():
    """Verify unauthenticated/anonymous calls are rejected gracefully."""
    result = await search_user_documents.ainvoke({
        "query": "What are the specs in my document?",
    }, config={"configurable": {"user_id": "anonymous"}})

    assert "Please log in to your Nexora account" in result


@pytest.mark.asyncio
async def test_search_user_documents_success():
    """Verify tool passes user_id and query to run_agentic_rag and returns formatted answer."""
    mock_rag_response = {
        "query": "What is the project deadline?",
        "answer": "According to [roadmap.pdf, Page 3], the deadline is November 30.",
        "sources": [{"filename": "roadmap.pdf", "page_number": 3}],
        "is_grounded": True,
    }

    with patch("app.ai.tool.rag_tool.run_agentic_rag", new=AsyncMock(return_value=mock_rag_response)) as mock_rag:
        result = await search_user_documents.ainvoke({
            "query": "What is the project deadline?",
        }, config={"configurable": {"user_id": "123e4567-e89b-12d3-a456-426614174000"}})

        assert "the deadline is November 30" in result
        mock_rag.assert_called_once_with(
            query="What is the project deadline?",
            user_id="123e4567-e89b-12d3-a456-426614174000",
            document_id=None,
        )


@pytest.mark.asyncio
async def test_search_user_documents_scoped_enforcement():
    """Verify configurable document_id is strictly passed to run_agentic_rag."""
    mock_rag_response = {
        "query": "Summarize this document",
        "answer": "This is Sandeep's profile summary.",
        "sources": [{"filename": "Sandeep.pdf", "page_number": 1}],
        "is_grounded": True,
    }

    with patch("app.ai.tool.rag_tool.run_agentic_rag", new=AsyncMock(return_value=mock_rag_response)) as mock_rag:
        result = await search_user_documents.ainvoke({
            "query": "Summarize this document",
        }, config={
            "configurable": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "document_id": "sandeep-doc-id-123",
            }
        })

        assert "Sandeep's profile summary" in result
        mock_rag.assert_called_once_with(
            query="Summarize this document",
            user_id="123e4567-e89b-12d3-a456-426614174000",
            document_id="sandeep-doc-id-123",
        )


@pytest.mark.asyncio
async def test_search_user_documents_config_overrides_tool_arg():
    """Verify config document_id overrides any hallucinated tool arg."""
    mock_rag_response = {
        "query": "Summarize this document",
        "answer": "Accurate scoped summary.",
        "sources": [{"filename": "Sandeep.pdf", "page_number": 1}],
        "is_grounded": True,
    }

    with patch("app.ai.tool.rag_tool.run_agentic_rag", new=AsyncMock(return_value=mock_rag_response)) as mock_rag:
        result = await search_user_documents.ainvoke({
            "query": "Summarize this document",
            "document_id": "hallucinated-old-doc-id",
        }, config={
            "configurable": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "document_id": "user-locked-doc-id",
            }
        })

        assert "Accurate scoped summary" in result
        mock_rag.assert_called_once_with(
            query="Summarize this document",
            user_id="123e4567-e89b-12d3-a456-426614174000",
            document_id="user-locked-doc-id",
        )
