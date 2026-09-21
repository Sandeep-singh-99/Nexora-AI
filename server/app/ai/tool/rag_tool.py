import logging
from typing import Optional
from uuid import UUID
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig

from app.ai.rag.rag_agent import run_agentic_rag
from app.core.database import AsyncSessionLocal
from app.ai.rag.vector_store import DocumentVectorStore

logger = logging.getLogger(__name__)


@tool
async def list_user_documents(
    config: RunnableConfig = None,
) -> str:
    """List all documents (PDFs and Word DOCX) uploaded by the user in their knowledge base.
    Use this tool whenever:
    - The user asks what documents, PDFs, or files they have uploaded
    - The user asks for the name/title of 'this document' or 'this PDF'
    - You need to see available documents to determine which file to query.
    """
    user_id = None
    if config:
        configurable = config.get("configurable", {})
        metadata = config.get("metadata", {})
        user_id = configurable.get("user_id") or metadata.get("user_id")

    if not user_id or user_id == "anonymous":
        return "You are currently not logged in. Please log in to view your uploaded documents."

    try:
        user_uuid = UUID(str(user_id))
        async with AsyncSessionLocal() as session:
            docs = await DocumentVectorStore.get_user_documents(session, user_uuid)

        if not docs:
            return "The user currently has no uploaded documents in their knowledge base."

        lines = []
        for d in docs:
            lines.append(
                f"- **{d.filename}** (Type: {d.file_type.upper()}, Pages: {d.total_pages}, Chunks: {d.total_chunks}, ID: `{d.id}`)"
            )
        return "User's Uploaded Documents:\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Error listing user documents: {e}")
        return f"Could not retrieve document list: {str(e)}"


@tool
async def search_user_documents(
    query: str,
    document_id: Optional[str] = None,
    config: RunnableConfig = None,
) -> str:
    """Search, retrieve, and analyze information from the user's uploaded documents (PDFs and DOCX).
    Use this tool when the user asks questions about their uploaded files, contracts, reports, notes, or uploaded data.
    Also use this tool when the user asks to summarize, explain, or get the context of their document.
    DO NOT use this tool for general knowledge questions or questions not related to user-uploaded files.
    """
    user_id = None
    target_doc_id = document_id
    if config:
        configurable = config.get("configurable", {})
        metadata = config.get("metadata", {})
        user_id = configurable.get("user_id") or metadata.get("user_id")
        if not target_doc_id:
            target_doc_id = configurable.get("document_id") or metadata.get("document_id")

    if not user_id or user_id == "anonymous":
        return (
            "You are currently not logged in or have not provided an authenticated session. "
            "Please log in to your Nexora account and upload documents to query them."
        )

    logger.info(f"Executing search_user_documents for user {user_id} with query: '{query}' (doc_id={target_doc_id})")

    try:
        rag_result = await run_agentic_rag(
            query=query,
            user_id=str(user_id),
            document_id=str(target_doc_id) if target_doc_id else None,
        )
        return rag_result.get("answer", "No response generated from documents.")
    except Exception as e:
        logger.error(f"search_user_documents tool execution failed: {e}")
        return f"An error occurred while searching your uploaded documents: {str(e)}"
