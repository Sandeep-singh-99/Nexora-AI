import uuid
import pytest
from app.ai.rag.vector_store import RetrievedChunk
from app.ai.rag.grader import evaluate_context_sufficiency, SufficiencyEvaluation
from app.ai.rag.rag_agent import should_re_retrieve, RagAgentState


def test_sufficiency_evaluation_empty_chunks():
    """Verify evaluator reports insufficient when chunk list is empty."""
    eval_result = evaluate_context_sufficiency("What is the refund policy?", [])
    assert eval_result.is_sufficient is False
    assert "No relevant document chunks were found" in eval_result.reason


def test_should_re_retrieve_decision_logic():
    """Verify conditional edges in the LangGraph workflow."""
    # 1. When sufficient, should generate grounded
    state_sufficient: RagAgentState = {
        "query": "Q",
        "user_id": "u",
        "document_id": None,
        "current_search_query": "Q",
        "retrieved_chunks": [],
        "retrieval_history": [],
        "is_sufficient": True,
        "retry_count": 0,
        "max_retries": 1,
        "answer": "",
        "sources": [],
    }
    assert should_re_retrieve(state_sufficient) == "generate_grounded"

    # 2. When insufficient and retry_count < max_retries, should refine query
    state_refine: RagAgentState = {
        **state_sufficient,
        "is_sufficient": False,
        "retry_count": 0,
        "max_retries": 1,
    }
    assert should_re_retrieve(state_refine) == "refine_query"

    # 3. When insufficient and retry_count >= max_retries, should fallback to not_found
    state_not_found: RagAgentState = {
        **state_sufficient,
        "is_sufficient": False,
        "retry_count": 1,
        "max_retries": 1,
    }
    assert should_re_retrieve(state_not_found) == "not_found"
