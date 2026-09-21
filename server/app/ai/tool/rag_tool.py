import logging
from typing import Optional
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig

from app.ai.rag.rag_agent import run_agentic_rag

logger = logging.getLogger(__name__)


@tool
async def search_user_documents(
    query: str,
    document_id: Optional[str] = None,
    config: RunnableConfig = None,
) -> str:
    """Search, retrieve, and analyze information from the user's uploaded documents (PDFs and DOCX).
    Use this tool when the user asks questions about their uploaded files, contracts, reports, notes, or uploaded data.
    DO NOT use this tool for general knowledge questions or questions not related to user-uploaded files.
    """
    user_id = None
    if config:
        configurable = config.get("configurable", {})
        metadata = config.get("metadata", {})
        user_id = configurable.get("user_id") or metadata.get("user_id")

    if not user_id or user_id == "anonymous":
        return (
            "You are currently not logged in or have not provided an authenticated session. "
            "Please log in to your Nexora account and upload documents to query them."
        )

    logger.info(f"Executing search_user_documents for user {user_id} with query: '{query}'")

    try:
        rag_result = await run_agentic_rag(
            query=query,
            user_id=str(user_id),
            document_id=document_id,
        )
        return rag_result.get("answer", "No response generated from documents.")
    except Exception as e:
        logger.error(f"search_user_documents tool execution failed: {e}")
        return f"An error occurred while searching your uploaded documents: {str(e)}"
