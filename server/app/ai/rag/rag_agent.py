import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.database import AsyncSessionLocal
from app.ai.core.llm import get_llm
from app.ai.rag.vector_store import DocumentVectorStore, RetrievedChunk
from app.ai.rag.grader import aevaluate_context_sufficiency, SufficiencyEvaluation

logger = logging.getLogger(__name__)


class RagAgentState(TypedDict):
    """Internal state for the Agentic RAG workflow."""
    query: str
    user_id: str
    document_id: Optional[str]
    current_search_query: str
    retrieved_chunks: List[RetrievedChunk]
    retrieval_history: List[str]
    is_sufficient: bool
    retry_count: int
    max_retries: int
    answer: str
    sources: List[Dict[str, Any]]


async def retrieve_node(state: RagAgentState) -> dict:
    """Retrieves top relevant chunks from pgvector scoped strictly to the authenticated user."""
    user_id_str = state.get("user_id")
    doc_id_str = state.get("document_id")
    search_q = state.get("current_search_query") or state.get("query", "")

    if not user_id_str or user_id_str == "anonymous":
        return {
            "retrieved_chunks": [],
            "retrieval_history": [search_q],
        }

    try:
        user_uuid = UUID(user_id_str)
        doc_uuid = UUID(doc_id_str) if doc_id_str else None
    except (ValueError, TypeError) as err:
        logger.warning(f"Invalid UUID in RAG state (user_id={user_id_str}): {err}")
        return {
            "retrieved_chunks": [],
            "retrieval_history": [search_q],
        }

    async with AsyncSessionLocal() as session:
        try:
            new_chunks = await DocumentVectorStore.similarity_search(
                db=session,
                user_id=user_uuid,
                query=search_q,
                limit=4,
                document_id=doc_uuid,
                threshold=0.25,
            )
        except Exception as e:
            logger.error(f"Error executing similarity search: {e}")
            new_chunks = []

    # Merge and deduplicate with previously retrieved chunks
    existing_chunks = state.get("retrieved_chunks") or []
    seen_contents = {c.content for c in existing_chunks}
    merged_chunks = list(existing_chunks)

    for chunk in new_chunks:
        if chunk.content not in seen_contents:
            seen_contents.add(chunk.content)
            merged_chunks.append(chunk)

    history = list(state.get("retrieval_history") or [])
    history.append(search_q)

    return {
        "retrieved_chunks": merged_chunks,
        "retrieval_history": history,
    }


async def evaluate_node(state: RagAgentState) -> dict:
    """Evaluates whether retrieved chunks contain sufficient information to answer user query."""
    query = state.get("query", "")
    chunks = state.get("retrieved_chunks", [])

    evaluation: SufficiencyEvaluation = await aevaluate_context_sufficiency(query, chunks)
    return {
        "is_sufficient": evaluation.is_sufficient,
        "current_search_query": evaluation.refined_query or query,
    }


def should_re_retrieve(state: RagAgentState) -> str:
    """Decides next step: generate answer, refine and re-retrieve, or trigger fallback."""
    is_sufficient = state.get("is_sufficient", False)
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 1)

    if is_sufficient:
        return "generate_grounded"
    elif retry_count < max_retries:
        return "refine_query"
    else:
        # Insufficient after retries
        return "not_found"


async def refine_query_node(state: RagAgentState) -> dict:
    """Increments retry count for re-retrieval with refined query."""
    current_retry = state.get("retry_count", 0)
    return {
        "retry_count": current_retry + 1,
    }


async def generate_grounded_node(state: RagAgentState) -> dict:
    """Synthesizes a response strictly grounded in the retrieved document chunks."""
    query = state.get("query", "")
    chunks = state.get("retrieved_chunks", [])

    # Format context with citations
    context_blocks = []
    sources = []
    for idx, c in enumerate(chunks):
        doc_label = f"[Source {idx+1}: {c.filename}, Page {c.page_number or 'N/A'}]"
        context_blocks.append(f"{doc_label}\n{c.content}")
        sources.append({
            "filename": c.filename,
            "page_number": c.page_number,
            "chunk_index": c.chunk_index,
            "similarity_score": round(c.similarity_score, 4),
        })

    formatted_context = "\n\n---\n\n".join(context_blocks)

    system_prompt = (
        "You are Nexora's Document Assistant. Your role is to provide accurate, "
        "helpful answers strictly based on the user's uploaded documents.\n\n"
        "### GROUNDING RULES\n"
        "1. Answer ONLY using the facts explicitly stated in the DOCUMENT CONTEXT below.\n"
        "2. Do NOT hallucinate, extrapolate, or assume facts not present in the text.\n"
        "3. Cite your sources naturally using document names and page numbers (e.g., [Filename, Page X]).\n"
        "4. If a detail asked about is missing or unclear in the context, explicitly acknowledge what is missing.\n"
        "5. Use clear, well-structured Markdown with bullet points where appropriate."
    )

    user_message = (
        f"### USER QUESTION:\n{query}\n\n"
        f"### DOCUMENT CONTEXT:\n{formatted_context}\n\n"
        "Please provide a comprehensive, grounded answer based solely on the document context above:"
    )

    try:
        llm = get_llm("groq")
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message),
        ])
        answer_text = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        logger.error(f"Error generating grounded RAG response: {e}")
        # Fallback to Gemini if Groq encountered error
        try:
            gemini_llm = get_llm("gemini")
            response = await gemini_llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ])
            answer_text = response.content if hasattr(response, "content") else str(response)
        except Exception as gemini_err:
            logger.error(f"Gemini fallback also failed: {gemini_err}")
            answer_text = "I encountered an error synthesizing the answer from your documents. Please try again."

    return {
        "answer": str(answer_text),
        "sources": sources,
    }


async def not_found_node(state: RagAgentState) -> dict:
    """Informs the user clearly that the requested information is absent from their documents."""
    query = state.get("query", "")
    return {
        "answer": (
            f"I could not find information regarding **'{query}'** in your uploaded documents.\n\n"
            "Please ensure that the relevant document (PDF or DOCX) has been uploaded, "
            "or try rephrasing your question with different terms."
        ),
        "sources": [],
    }


# Construct the Agentic RAG LangGraph
builder = StateGraph(RagAgentState)

builder.add_node("retrieve", retrieve_node)
builder.add_node("evaluate", evaluate_node)
builder.add_node("refine_query", refine_query_node)
builder.add_node("generate_grounded", generate_grounded_node)
builder.add_node("not_found", not_found_node)

builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "evaluate")
builder.add_conditional_edges(
    "evaluate",
    should_re_retrieve,
    {
        "generate_grounded": "generate_grounded",
        "refine_query": "refine_query",
        "not_found": "not_found",
    },
)
builder.add_edge("refine_query", "retrieve")
builder.add_edge("generate_grounded", END)
builder.add_edge("not_found", END)

rag_graph = builder.compile()


async def run_agentic_rag(
    query: str,
    user_id: str,
    document_id: Optional[str] = None,
    max_retries: int = 1,
) -> Dict[str, Any]:
    """
    Executes the full Agentic RAG pipeline:
    - Scoped strictly by user_id and document_id.
    - Evaluates retrieval sufficiency.
    - Performs query refinement / re-retrieval when context is partial.
    - Generates grounded answer with citations or explicit not-found statement.
    """
    initial_state: RagAgentState = {
        "query": query,
        "user_id": user_id,
        "document_id": document_id,
        "current_search_query": query,
        "retrieved_chunks": [],
        "retrieval_history": [],
        "is_sufficient": False,
        "retry_count": 0,
        "max_retries": max_retries,
        "answer": "",
        "sources": [],
    }

    final_state = await rag_graph.ainvoke(initial_state)

    is_grounded = bool(final_state.get("sources")) and final_state.get("is_sufficient", False)
    return {
        "query": query,
        "answer": final_state.get("answer", ""),
        "sources": final_state.get("sources", []),
        "is_grounded": is_grounded,
    }
