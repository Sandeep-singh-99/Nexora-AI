from deepagents import create_deep_agent
from app.ai.core.llm import get_llm
from app.ai.tool.internet_search import internet_search
from app.ai.middleware.tool_error import (
    get_tool_error_middleware,
)


research_agent = create_deep_agent(
    model=get_llm("gemini"),
    tools=[internet_search],
    middleware=[
        get_tool_error_middleware(),
    ],
    system_prompt=(
        "You are Nexora's research assistant.\n"
        "Provide factual, structured, and in-depth answers to user inquiries using web search tools."
    ),
)
