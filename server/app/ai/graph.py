from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.ai.core.state import AgentState
from app.ai.middleware.abuse_filter import (
    input_guardrail_node,
    blocked_response_node,
    output_guardrail_node,
)
from app.ai.agents.router import router_node
from app.ai.agents.chat_agent import chat_agent
from app.ai.agents.coding_agent import coding_agent
from app.ai.agents.math_agent import math_agent


def guardrail_check(state: AgentState) -> str:
    """Routes based on input guardrail evaluation."""
    if state.get("is_blocked"):
        return "blocked"
    return "safe"


def route_decision(state: AgentState) -> str:
    """Routes request to target agent based on router node decision."""
    return state.get("next_step", "chat_agent")


builder = StateGraph(AgentState)

# 1. Register Nodes
builder.add_node("input_guardrail", input_guardrail_node)
builder.add_node("blocked_response", blocked_response_node)
builder.add_node("router", router_node)
builder.add_node("chat_agent", chat_agent)
builder.add_node("coding_agent", coding_agent)
builder.add_node("math_agent", math_agent)
builder.add_node("output_guardrail", output_guardrail_node)

# 2. Graph Pipeline Edges
builder.add_edge(START, "input_guardrail")

# Input Guardrail Conditional Routing
builder.add_conditional_edges(
    "input_guardrail",
    guardrail_check,
    {
        "blocked": "blocked_response",
        "safe": "router",
    },
)

# Blocked response goes straight to END
builder.add_edge("blocked_response", END)

# Router Agent Decision Conditional Routing
builder.add_conditional_edges(
    "router",
    route_decision,
    {
        "chat_agent": "chat_agent",
        "coding_agent": "coding_agent",
        "math_agent": "math_agent",
    },
)

# All agents route through Output Guardrail before finishing
builder.add_edge("chat_agent", "output_guardrail")
builder.add_edge("coding_agent", "output_guardrail")
builder.add_edge("math_agent", "output_guardrail")

builder.add_edge("output_guardrail", END)

memory = MemorySaver()
ai_graph = builder.compile(checkpointer=memory)