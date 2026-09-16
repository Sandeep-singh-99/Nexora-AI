from langchain.agents import create_agent
from app.ai.core.llm import get_llm
from app.ai.tool.tavily import tavily_search
from app.ai.middleware.tool_error import (
    get_tool_error_middleware,
    get_tool_retry_middleware,
)

search_tool = tavily_search()

research_agent = create_agent(
    model=get_llm("groq"),
    tools=[search_tool],
    middleware=[
        get_tool_error_middleware(),
        get_tool_retry_middleware(tools=[search_tool.name]),
    ],
    system_prompt=(
        "You are Nexora's research assistant.\n"
        "Provide factual, structured, and in-depth answers to user inquiries using web search tools."
    ),
)
