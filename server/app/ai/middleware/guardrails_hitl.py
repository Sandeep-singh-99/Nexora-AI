import logging
from typing import Optional, Dict, Any
from langchain.agents.middleware import HumanInTheLoopMiddleware

logger = logging.getLogger(__name__)


def get_guardrails_hitl_middleware(
    interrupt_on: Optional[Dict[str, Any]] = None,
    description_prefix: str = "Nexora Guardrails: Tool execution requires human approval",
) -> HumanInTheLoopMiddleware:
    """
    Constructs a HumanInTheLoopMiddleware from langchain.agents.middleware
    for enforcing agent guardrails and requiring user confirmation before executing
    sensitive tool actions or document searches.
    """
    target_interrupts = interrupt_on or {
        "search_user_documents": {
            "allowed_decisions": ["approve", "reject"],
        }
    }

    logger.info("Initializing HumanInTheLoopMiddleware with guardrail interrupts: %s", list(target_interrupts.keys()))

    return HumanInTheLoopMiddleware(
        interrupt_on=target_interrupts,
        description_prefix=description_prefix,
    )
