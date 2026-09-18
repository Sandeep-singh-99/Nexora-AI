import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.ai.core.llm import get_llm
from app.ai.agents.research.state import (
    ResearchGraphState,
    ResearchPlan,
    EvaluationResult,
)
from app.ai.agents.research.subagents import (
    deep_search_subagent,
    verifier_subagent,
    evaluator_subagent,
)

logger = logging.getLogger(__name__)


async def plan_research_node(state: ResearchGraphState) -> dict:
    """Deconstructs user inquiry into focused multi-angle research sub-questions."""
    messages = state.get("messages", [])
    user_query = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            user_query = msg.content
            break
    if not user_query and messages:
        user_query = str(messages[-1].content)

    llm = get_llm("gemini")
    structured_llm = llm.with_structured_output(ResearchPlan)

    prompt = (
        "Analyze the user inquiry and generate a focused, multi-angle deep research plan.\n"
        f"User Inquiry: {user_query}"
    )

    try:
        plan: ResearchPlan = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        return {
            "core_topic": plan.core_topic,
            "inquiry_angles": plan.inquiry_angles,
            "iteration_count": 0,
        }
    except Exception as e:
        logger.warning("Structured planning fallback: %s", e)
        return {
            "core_topic": user_query,
            "inquiry_angles": [
                f"Overview and current state of {user_query}",
                f"Key developments, technical details, and data for {user_query}",
                f"Challenges, outlook, and future implications of {user_query}",
            ],
            "iteration_count": 0,
        }


async def deep_research_node(state: ResearchGraphState) -> dict:
    """Subagent 1: Executes deep search across all inquiry angles."""
    topic = state.get("core_topic", "")
    angles = state.get("inquiry_angles", [])
    critique = state.get("critique")

    prompt = (
        f"Conduct deep research on the primary topic: '{topic}'.\n\n"
        f"Specific inquiry angles to investigate:\n"
        + "\n".join([f"- {angle}" for angle in angles])
    )
    if critique:
        prompt += f"\n\nAdditional guidance from previous review:\n{critique}"

    result = await deep_search_subagent.ainvoke({
        "messages": [HumanMessage(content=prompt)]
    })

    raw_content = result["messages"][-1].content
    return {"raw_research": str(raw_content)}


async def verify_content_node(state: ResearchGraphState) -> dict:
    """Subagent 2: Cross-checks, validates citations, and verifies facts."""
    topic = state.get("core_topic", "")
    raw_research = state.get("raw_research", "")

    prompt = (
        f"Verify the following research findings on topic '{topic}'.\n"
        "Check fact validity, cross-reference statistics/dates, verify source attribution, "
        "and structure into a verified findings brief:\n\n"
        f"{raw_research}"
    )

    result = await verifier_subagent.ainvoke({
        "messages": [HumanMessage(content=prompt)]
    })

    verified_content = result["messages"][-1].content
    return {"verified_findings": str(verified_content)}


async def synthesize_draft_node(state: ResearchGraphState) -> dict:
    """Synthesizes verified research into an exhaustive Markdown report."""
    topic = state.get("core_topic", "")
    verified_findings = state.get("verified_findings", "")
    critique = state.get("critique")
    iteration = state.get("iteration_count", 0) + 1

    prompt = (
        f"You are the Lead Research Synthesizer. Write an exhaustive, publication-grade research report on: '{topic}'.\n\n"
        f"Verified Research Findings:\n{verified_findings}\n\n"
        "Structure the report with:\n"
        "# [Comprehensive Title]\n"
        "## Executive Summary\n"
        "## Detailed Analysis & Thematic Breakdown\n"
        "## Comparative Data & Key Metrics (Use Markdown tables where relevant)\n"
        "## Challenges, Limitations & Strategic Outlook\n"
        "## Verified Sources & References (Include URLs)\n"
    )
    if critique:
        prompt += f"\n\nAddress previous editorial critique:\n{critique}"

    llm = get_llm("gemini")
    response = await llm.ainvoke([
        SystemMessage(content="You produce authoritative, clear, and comprehensive research reports."),
        HumanMessage(content=prompt)
    ])

    return {
        "draft_report": str(response.content),
        "iteration_count": iteration,
    }


async def evaluate_and_polish_node(state: ResearchGraphState) -> dict:
    """Subagent 3: Evaluates the draft, ensures quality standards, and polishes."""
    topic = state.get("core_topic", "")
    draft = state.get("draft_report", "")
    iteration = state.get("iteration_count", 1)

    llm = get_llm("gemini")
    eval_llm = llm.with_structured_output(EvaluationResult)

    prompt = (
        f"Review and evaluate the following research report on '{topic}'.\n\n"
        f"Draft Report:\n{draft}\n\n"
        "Determine if the report is ready for publication (approved) or needs revision. "
        "If approved, provide the final polished Markdown version with any minor formatting or stylistic enhancements applied."
    )

    try:
        evaluation: EvaluationResult = await eval_llm.ainvoke([HumanMessage(content=prompt)])
        if iteration >= 2 or evaluation.is_approved:
            final_text = evaluation.final_polished_report or draft
            return {
                "critique": None,
                "final_output": final_text,
            }
        return {
            "critique": evaluation.critique,
            "final_output": draft,
        }
    except Exception as e:
        logger.warning("Evaluation fallback: %s", e)
        return {
            "critique": None,
            "final_output": draft,
        }


def should_continue_refinement(state: ResearchGraphState) -> str:
    """Routes to refinement if critique is present and max iterations not exceeded."""
    if state.get("critique") and state.get("iteration_count", 0) < 2:
        return "refine"
    return "publish"


async def publish_final_node(state: ResearchGraphState) -> dict:
    """Emits the final polished research report into the message stream."""
    final_report = state.get("final_output") or state.get("draft_report", "Research completed.")
    return {
        "messages": [AIMessage(content=final_report)]
    }
