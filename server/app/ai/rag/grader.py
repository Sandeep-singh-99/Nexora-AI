import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from app.ai.core.llm import get_llm
from app.ai.rag.vector_store import RetrievedChunk

logger = logging.getLogger(__name__)


class SufficiencyEvaluation(BaseModel):
    """Evaluation of retrieved document context against user query."""
    is_sufficient: bool = Field(
        description="True if the context provides enough factual information to answer the user's question, False otherwise."
    )
    reason: str = Field(
        description="Brief explanation of why the context is or is not sufficient."
    )
    refined_query: Optional[str] = Field(
        default=None,
        description="A refined, keyword-focused search query to find missing context if not sufficient, or None if sufficient."
    )


def evaluate_context_sufficiency(
    query: str,
    chunks: List[RetrievedChunk],
) -> SufficiencyEvaluation:
    """
    Evaluates whether the retrieved document chunks contain sufficient information
    to accurately and comprehensively answer the user's query.
    If insufficient, suggests a refined query for re-retrieval.
    """
    if not chunks:
        return SufficiencyEvaluation(
            is_sufficient=False,
            reason="No relevant document chunks were found in the database.",
            refined_query=query,
        )

    context_str = "\n\n---\n\n".join(
        [f"[Document: {c.filename} | Page: {c.page_number or 'N/A'}]\n{c.content}" for c in chunks[:5]]
    )

    prompt = (
        "You are an expert context relevance evaluator in a Retrieval-Augmented Generation (RAG) system.\n\n"
        "### TASK\n"
        "Analyze the user's QUESTION and the RETRIEVED DOCUMENT CONTEXT.\n"
        "Determine if the context contains enough relevant factual information to answer the question.\n\n"
        "### CRITERIA\n"
        "1. Set `is_sufficient` to TRUE if the context directly addresses the question or provides substantial relevant facts.\n"
        "2. Set `is_sufficient` to FALSE if the context is completely unrelated, too vague, or missing the specific facts needed.\n"
        "3. If FALSE, formulate a `refined_query` that rephrases the question into targeted keywords or alternate phrasing.\n\n"
        f"### USER QUESTION:\n{query}\n\n"
        f"### RETRIEVED CONTEXT:\n{context_str}\n"
    )

    try:
        # Attempt structured output using Groq/Gemini
        llm = get_llm("groq")
        structured_llm = llm.with_structured_output(SufficiencyEvaluation)
        result = structured_llm.invoke(prompt)
        if isinstance(result, SufficiencyEvaluation):
            return result
        elif isinstance(result, dict):
            return SufficiencyEvaluation(**result)
    except Exception as e:
        logger.warning(f"Error during structured sufficiency evaluation: {e}; applying heuristic evaluation.")

    # Heuristic fallback: check similarity scores of retrieved chunks
    avg_score = sum(c.similarity_score for c in chunks) / len(chunks)
    if avg_score >= 0.40 and len(chunks) >= 1:
        return SufficiencyEvaluation(
            is_sufficient=True,
            reason="Heuristic evaluation: Retrieved chunks exceed similarity relevance threshold.",
            refined_query=None,
        )

    return SufficiencyEvaluation(
        is_sufficient=False,
        reason="Heuristic evaluation: Retrieved chunks do not meet relevance threshold.",
        refined_query=f"{query} details overview",
    )


async def aevaluate_context_sufficiency(
    query: str,
    chunks: List[RetrievedChunk],
) -> SufficiencyEvaluation:
    """Async wrapper for context sufficiency evaluation."""
    import asyncio
    return await asyncio.to_thread(evaluate_context_sufficiency, query, chunks)
