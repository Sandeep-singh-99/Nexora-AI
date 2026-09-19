from typing import Literal
from pydantic import BaseModel, Field
from langchain.agents import create_agent
from app.ai.core.llm import get_llm
from app.ai.core.state import AgentState, get_trimmed_messages


class RouteDecision(BaseModel):
    next_step: Literal["chat_agent", "coding_agent", "math_agent"] = Field(
        description="The target agent node to handle the request."
    )


router_agent = create_agent(
    model=get_llm("groq"),
    tools=[],
    system_prompt=(
        "You are a routing agent. "
        "Analyze the user's request and choose exactly one target agent.\n\n"
        "chat_agent:\n"
        "- General conversation\n"
        "- Greetings\n"
        "- General Q&A\n"
        "- Current information and factual questions\n"
        "- Web research/search requests\n"
        "- News\n"
        "- Current time/date questions\n\n"
        "coding_agent:\n"
        "- Programming questions\n"
        "- Debugging\n"
        "- Code generation\n"
        "- Software architecture\n"
        "- Framework/library implementation\n\n"
        "math_agent:\n"
        "- Mathematical equations\n"
        "- Algebra\n"
        "- Calculus\n"
        "- Derivatives\n"
        "- Integrals\n"
        "- Limits\n"
        "- Matrices\n"
        "- Factorization\n"
        "- Simplification\n"
        "- Statistics\n"
        "- Symbolic computation\n\n"
        "Choose the agent that best matches the user's primary intent."
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
