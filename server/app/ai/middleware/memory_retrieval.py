import logging
from uuid import UUID
from typing import Any, Dict, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from app.ai.core.state import AgentState
from app.core.database import AsyncSessionLocal
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)


async def memory_retrieval_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """
    LangGraph node placed immediately after input_guardrail.
    Fetches top-3 relevant user preferences/memories via pgvector cosine distance
    and injects them into the agent prompt context.
    """
    configurable = config.get("configurable", {}) if isinstance(config, dict) else getattr(config, "configurable", {})
    metadata = config.get("metadata", {}) if isinstance(config, dict) else getattr(config, "metadata", {})

    raw_user_id = configurable.get("user_id") or metadata.get("user_id")
    if not raw_user_id or raw_user_id == "anonymous":
        return {"user_memories": []}

    try:
        user_uuid = UUID(str(raw_user_id))
    except (ValueError, TypeError):
        logger.debug("Invalid user_id format for memory retrieval: %s", raw_user_id)
        return {"user_memories": []}

    # Extract user's latest query text
    messages = state.get("messages", [])
    query_text = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            content = getattr(msg, "content", "")
            if isinstance(content, str) and content.strip():
                query_text = content.strip()
                break
            elif isinstance(content, list):
                text_parts = [p.get("text", "") if isinstance(p, dict) else str(p) for p in content]
                query_text = " ".join(text_parts).strip()
                if query_text:
                    break

    if not query_text:
        return {"user_memories": []}

    try:
        async with AsyncSessionLocal() as session:
            memories = await MemoryService.get_relevant_memories(
                db=session,
                user_id=user_uuid,
                query_text=query_text,
                limit=3,
            )

        if not memories:
            return {"user_memories": []}

        memory_items = [m.memory_text for m in memories if m.memory_text]
        if not memory_items:
            return {"user_memories": []}

        formatted_memories = "\n".join(f"- {text}" for text in memory_items)
        prompt_injection = (
            f"[User Long-Term Preferences & Learned Context]:\n"
            f"{formatted_memories}\n\n"
            f"[MANDATE: Incorporate the above user preferences, technical stack choices, and background details "
            f"when formulating your response, unless explicitly overridden by the user's latest message.]"
        )

        memory_message = SystemMessage(
            content=prompt_injection,
            id="user_memory_context",
        )

        logger.info("Injected %d long-term memories for user %s into agent context.", len(memory_items), user_uuid)
        return {
            "user_memories": memory_items,
            "messages": [memory_message],
        }

    except Exception as e:
        logger.warning("Error retrieving long-term memories for user %s: %s", raw_user_id, e)
        return {"user_memories": []}
