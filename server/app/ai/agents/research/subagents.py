from deepagents import create_deep_agent
from app.ai.core.llm import get_llm
from app.ai.tool.internet_search import internet_search
from app.ai.middleware.tool_error import get_tool_error_middleware
from app.ai.agents.research.prompts import (
    RESEARCH_INSTRUCTIONS,
    VERIFIER_INSTRUCTIONS,
    EVALUATOR_INSTRUCTIONS,
)

# Subagent 1: Deep Web Research Specialist (Google Search Grounding)
deep_search_subagent = create_deep_agent(
    model=get_llm("gemini"),
    tools=[internet_search],
    system_prompt=RESEARCH_INSTRUCTIONS,
    middleware=[get_tool_error_middleware()],
)

# Subagent 2: Content & Citation Verification Subagent
verifier_subagent = create_deep_agent(
    model=get_llm("gemini"),
    tools=[internet_search],
    system_prompt=VERIFIER_INSTRUCTIONS,
    middleware=[get_tool_error_middleware()],
)

# Subagent 3: Research Evaluator & Quality Polisher
evaluator_subagent = create_deep_agent(
    model=get_llm("gemini"),
    system_prompt=EVALUATOR_INSTRUCTIONS,
    middleware=[get_tool_error_middleware()],
)
