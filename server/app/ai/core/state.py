from typing import Annotated, Sequence, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage, trim_messages
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next_step: Optional[str]
    is_blocked: Optional[bool]
    block_reason: Optional[str]
    user_memories: Optional[list[str]]


def count_tokens(messages: Sequence[BaseMessage]) -> int:
    """Estimates token count of message sequence (1 token ~= 4 characters)."""
    total_chars = 0
    for m in messages:
        content = getattr(m, "content", "")
        if isinstance(content, str):
            total_chars += len(content)
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, str):
                    total_chars += len(part)
                elif isinstance(part, dict):
                    total_chars += len(str(part.get("text", "")))
    return max(1, total_chars // 4)


def get_trimmed_messages(messages: Sequence[BaseMessage], max_tokens: int = 3000) -> list[BaseMessage]:
    """Trims message history to fit within model context and TPM rate limits safely."""
    if not messages:
        return []
    try:
        return trim_messages(
            list(messages),
            max_tokens=max_tokens,
            strategy="last",
            token_counter=count_tokens,
            start_on="human",
            include_system=True,
            allow_partial=False,
        )
    except Exception:
        # Fallback if trimming fails: return last 6 messages
        return list(messages)[-6:]