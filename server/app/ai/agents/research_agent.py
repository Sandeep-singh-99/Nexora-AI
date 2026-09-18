from deepagents import create_deep_agent
from app.ai.core.llm import get_llm
from app.ai.tool.internet_search import internet_search
from app.ai.middleware.tool_error import (
    get_tool_error_middleware,
)

# System prompt to steer the subagent to be an expert researcher
research_instructions = """You are an expert researcher. Your job is to conduct thorough research and then write a polished report.

You have access to an internet search tool as your primary means of gathering information.

## `internet_search`

Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
"""

# Specialized Deep Research Subagent
research_subagent = {
    "name": "research-agent",
    "description": (
        "Specialized deep research subagent. Delegate to this agent to perform "
        "comprehensive internet searches, investigate sub-topics, gather evidence, "
        "and extract cited findings."
    ),
    "system_prompt": research_instructions,
    "tools": [internet_search],
    "model": get_llm("gemini"),
}

# Lead Research Supervisor System Prompt
lead_supervisor_instructions = """You are the Lead Research Director.
Your job is to orchestrate deep research on any topic requested by the user and produce a polished, publication-ready report.

Workflow:
1. **Plan & Deconstruct**: Break down the user's research topic into clear, focused research questions/angles.
2. **Delegate**: Use your `research-agent` subagent to investigate each angle thoroughly.
3. **Review & Iterate**: Analyze the findings returned by `research-agent`. If there are gaps or unanswered questions, dispatch another inquiry.
4. **Synthesize**: Write an exhaustive, well-structured Markdown report containing:
   - Executive Summary
   - In-depth Findings & Analysis
   - Key Data, Comparisons & Technical Details
   - Risks, Limitations & Future Outlook
   - List of Sources and Citations
"""

# Supervisor Deep Agent
research_agent = create_deep_agent(
    model=get_llm("gemini"),
    system_prompt=lead_supervisor_instructions,
    subagents=[research_subagent],
    middleware=[
        get_tool_error_middleware(),
    ],
)

