import logging
import asyncio
from typing import Optional, Sequence, Any, AsyncIterator
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    CheckpointTuple,
    Checkpoint,
    CheckpointMetadata,
    ChannelVersions,
)
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

logger = logging.getLogger(__name__)

from app.core.database import get_pg_pool
from app.ai.core.state import AgentState
from app.ai.middleware.abuse_filter import (
    input_guardrail_node,
    blocked_response_node,
    output_guardrail_node,
)
from app.ai.middleware.memory_retrieval import memory_retrieval_node
from app.ai.agents.router import router_node
from app.ai.agents.chat_agent import chat_agent
from app.ai.agents.coding_agent import coding_agent
from app.ai.agents.math_agent import math_agent


class PostgresCheckpointer(BaseCheckpointSaver):
    """
    Distributed PostgreSQL checkpointer for LangGraph using AsyncPostgresSaver.
    Allows seamless horizontal scaling across Kubernetes or multi-container instances
    without session loss.
    """

    def __init__(self, serde=None):
        super().__init__(serde=serde)
        self._saver: Optional[AsyncPostgresSaver] = None
        self._lock = asyncio.Lock()

    async def get_saver(self) -> AsyncPostgresSaver:
        if self._saver is not None:
            return self._saver
        async with self._lock:
            if self._saver is None:
                pool = await get_pg_pool()
                saver = AsyncPostgresSaver(pool)
                await saver.setup()
                self._saver = saver
            return self._saver

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        saver = await self.get_saver()
        return await saver.aget_tuple(config)

    async def alist(
        self,
        config: Optional[RunnableConfig],
        *,
        filter: Optional[dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        saver = await self.get_saver()
        async for item in saver.alist(config, filter=filter, before=before, limit=limit):
            yield item

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        saver = await self.get_saver()
        return await saver.aput(config, checkpoint, metadata, new_versions)

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        saver = await self.get_saver()
        return await saver.aput_writes(config, writes, task_id, task_path=task_path)

    async def adelete_thread(self, thread_id: str) -> None:
        saver = await self.get_saver()
        return await saver.adelete_thread(thread_id)

    # Sync fallbacks if called synchronously
    def get_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        raise NotImplementedError("Use async methods (aget_tuple) with PostgresCheckpointer")

    def list(self, *args, **kwargs):
        raise NotImplementedError("Use async methods (alist) with PostgresCheckpointer")

    def put(self, *args, **kwargs):
        raise NotImplementedError("Use async methods (aput) with PostgresCheckpointer")

    def put_writes(self, *args, **kwargs):
        raise NotImplementedError("Use async methods (aput_writes) with PostgresCheckpointer")


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
builder.add_node("memory_retrieval", memory_retrieval_node)
builder.add_node("blocked_response", blocked_response_node)
builder.add_node("router", router_node)
builder.add_node("chat_agent", chat_agent)
builder.add_node("coding_agent", coding_agent)
builder.add_node("math_agent", math_agent)
builder.add_node("output_guardrail", output_guardrail_node)

# 2. Graph Pipeline Edges
builder.add_edge(START, "input_guardrail")

# Input Guardrail Conditional Routing
# Safe requests proceed to memory retrieval to inject personalized long-term preferences
builder.add_conditional_edges(
    "input_guardrail",
    guardrail_check,
    {
        "blocked": "blocked_response",
        "safe": "memory_retrieval",
    },
)

# Blocked response goes straight to END
builder.add_edge("blocked_response", END)

# Memory retrieval passes enriched state to the intent router
builder.add_edge("memory_retrieval", "router")

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

# Distributed PostgreSQL Checkpointer
checkpointer = PostgresCheckpointer()
memory = checkpointer  # Backward-compatible alias
ai_graph = builder.compile(checkpointer=checkpointer)


async def init_graph_checkpointer() -> AsyncPostgresSaver:
    """Eagerly initializes and migrates PostgreSQL checkpointer tables."""
    return await checkpointer.get_saver()


async def clear_thread_memory(thread_id: str) -> bool:
    """Clear distributed checkpointer state for a specific thread."""
    try:
        await checkpointer.adelete_thread(str(thread_id))
        return True
    except Exception as e:
        logger.warning("Failed to clear thread memory for %s: %s", thread_id, e)
    return False