import hashlib
import json
import logging
from langchain_tavily import TavilySearch
from app.core.config import settings
from app.ai.middleware.tool_error import custom_tool_error_handler
from app.core.redis_cache import get_cache, set_cache

logger = logging.getLogger(__name__)


class CachedTavilySearch(TavilySearch):
    """Tavily search tool with automatic Redis response caching (1 hour TTL)."""

    async def _arun(self, query: str, **kwargs):
        query_hash = hashlib.sha256(query.strip().lower().encode()).hexdigest()
        cache_key = f"cache:tavily:{query_hash}"

        cached = await get_cache(cache_key)
        if cached is not None:
            logger.info(f"Tavily search cache hit for query: '{query}'")
            return cached

        res = await super()._arun(query, **kwargs)
        if res:
            await set_cache(cache_key, res, expire_seconds=3600)
        return res

    def _run(self, query: str, **kwargs):
        # Fallback to direct search if called synchronously
        return super()._run(query, **kwargs)


def tavily_search() -> TavilySearch:
    """Configures Tavily web search tool with caching and error handling."""
    tool = CachedTavilySearch(
        max_results=3,
        topic="general",
        tavily_api_key=settings.TAVILY_SEARCH,
    )
    tool.handle_tool_error = custom_tool_error_handler
    return tool