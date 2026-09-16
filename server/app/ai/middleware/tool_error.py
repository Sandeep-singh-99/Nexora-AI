import logging
from typing import Optional
from langchain.agents.middleware import ToolErrorMiddleware, ToolRetryMiddleware

logger = logging.getLogger(__name__)


def custom_tool_error_handler(error: Exception) -> str:
    """Formats friendly error responses when tool execution fails."""
    logger.warning("Tool execution error caught: %s", error)
    if isinstance(error, (ConnectionError, TimeoutError)):
        return "The web search tool encountered a network connection issue. Please retry or answer with available context."
    return f"Tool execution failed: {str(error)}. Please continue processing."


def get_tool_retry_middleware(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    tools: Optional[list[str]] = None,
) -> ToolRetryMiddleware:
    """Returns prebuilt ToolRetryMiddleware configured with exponential backoff retries."""
    return ToolRetryMiddleware(
        max_retries=max_retries,
        backoff_factor=backoff_factor,
        initial_delay=initial_delay,
        max_delay=max_delay,
        jitter=True,
        tools=tools or ["tavily_search_results_json"],
        retry_on=(ConnectionError, TimeoutError, Exception),
        on_failure=custom_tool_error_handler,
    )


def get_tool_error_middleware() -> ToolErrorMiddleware:
    """Returns prebuilt ToolErrorMiddleware configured with fallback error handling."""
    return ToolErrorMiddleware(
        on_error=custom_tool_error_handler,
    )
