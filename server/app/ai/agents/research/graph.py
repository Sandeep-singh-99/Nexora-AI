from langgraph.graph import StateGraph, START, END
from app.ai.agents.research.state import ResearchGraphState
from app.ai.agents.research.nodes import (
    plan_research_node,
    deep_research_node,
    verify_content_node,
    synthesize_draft_node,
    evaluate_and_polish_node,
    should_continue_refinement,
    publish_final_node,
)

# Construct Research StateGraph
builder = StateGraph(ResearchGraphState)

# Register Pipeline Nodes
builder.add_node("plan_research", plan_research_node)
builder.add_node("deep_research", deep_research_node)
builder.add_node("verify_content", verify_content_node)
builder.add_node("synthesize_draft", synthesize_draft_node)
builder.add_node("evaluate_and_polish", evaluate_and_polish_node)
builder.add_node("publish_final", publish_final_node)

# Connect Flow Edges
builder.add_edge(START, "plan_research")
builder.add_edge("plan_research", "deep_research")
builder.add_edge("deep_research", "verify_content")
builder.add_edge("verify_content", "synthesize_draft")
builder.add_edge("synthesize_draft", "evaluate_and_polish")

builder.add_conditional_edges(
    "evaluate_and_polish",
    should_continue_refinement,
    {
        "refine": "synthesize_draft",
        "publish": "publish_final",
    },
)

builder.add_edge("publish_final", END)

# Compiled research agent workflow
research_agent = builder.compile()
