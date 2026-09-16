from typing import Literal
from pydantic import BaseModel, Field
from langchain.agents import create_agent
from app.ai.core.llm import get_llm
from app.ai.core.state import AgentState, get_trimmed_messages


class RouteDecision(BaseModel):
    next_step: Literal["chat_agent", "coding_agent", "research_agent", "math_agent"] = Field(
        description="The target agent node to handle the request."
    )


router_agent = create_agent(
    model=get_llm("groq"),
    tools=[],
    system_prompt=(
        "Analyze the user request and choose the appropriate agent.\n"
        "- chat_agent: General conversation, greetings, simple Q&A, "
        "everyday questions, and ALL current time/date queries (e.g., 'What time is it in New Delhi?').\n"
        "- coding_agent: Programming, debugging, software architecture, code generation.\n"
        "- research_agent: Deep research, web search, external news, and in-depth factual topics (excluding time/date queries).\n"
        "- math_agent: Mathematical equations, algebra, calculus (derivatives, integrals, limits), matrix calculations, factorization, simplification, statistics, and symbolic computations."
    ),
    response_format=RouteDecision,
)


async def router_node(state: AgentState) -> dict:
    """Wrapper node for router_agent structured output decision."""
    try:
        messages = state.get("messages", [])
        # Trim messages for router to prevent token limit errors
        trimmed = get_trimmed_messages(messages, max_tokens=1000)
        result = await router_agent.ainvoke({"messages": trimmed})

        struct_resp = result.get("structured_response")
        if isinstance(struct_resp, RouteDecision):
            return {"next_step": struct_resp.next_step}
        elif isinstance(struct_resp, dict) and "next_step" in struct_resp:
            return {"next_step": struct_resp["next_step"]}
        return {"next_step": "chat_agent"}
    except Exception:
        return {"next_step": "chat_agent"}
