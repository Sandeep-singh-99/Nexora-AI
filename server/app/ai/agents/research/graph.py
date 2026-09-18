import os
from deepagents import create_deep_agent
from app.ai.core.llm import get_llm
from app.ai.tool.tavily import tavily_search
from app.ai.middleware.tool_error import get_tool_error_middleware
from app.ai.agents.research.prompts import (
    RESEARCH_INSTRUCTIONS,
    VERIFIER_INSTRUCTIONS,
)


# 1. Specialized Deep Research Subagent (Google Search Grounding)
research_subagent = {
    "name": "research-specialist",
    "description": (
        "Specialist subagent used to conduct deep web searches, extract verifiable facts, "
        "and gather cited evidence on specific subtopics."
    ),
    "system_prompt": RESEARCH_INSTRUCTIONS,
    "tools": [tavily_search],
    "model": get_llm("groq"),
}

# 2. Specialized Fact-Checking & Verification Subagent
verifier_subagent = {
    "name": "content-verifier",
    "description": (
        "Specialist subagent used to cross-reference claims against search grounding, "
        "validate citation URLs, and verify factual consistency."
    ),
    "system_prompt": VERIFIER_INSTRUCTIONS,
    "tools": [tavily_search],
    "model": get_llm("groq"),
}

# 3. Lead Supervisor Deep Research Agent
lead_research_prompt = """You are Nexora's Lead Research Director.
Your job is to conduct comprehensive, multi-angle research and produce an authoritative, publication-grade dossier with verified citations.

### RESEARCH METHODOLOGY
1. **Deconstruct & Plan**: Identify 2-4 primary inquiry angles (e.g. background, state of the art, empirical data, limitations, future outlook).
2. **Investigate & Search**: Use Google Search grounding to gather verifiable facts, statistics, dates, and direct source URLs.
3. **Verify & Cross-Check**: Ensure all claims are directly supported by search findings and authoritative citations.
4. **Synthesize & Format**: Write a structured Markdown report containing:
   - **Executive Summary**
   - **Detailed Thematic Analysis**
   - **Key Data & Comparisons** (use Markdown tables where relevant)
   - **Strategic Outlook & Limitations**
   - **References & Sources** (with direct source URLs)
"""

# Compiled Lead Deep Research Agent with Google Search Grounding
research_agent = create_deep_agent(
    model=get_llm("groq"),
    tools=[tavily_search],
    system_prompt=lead_research_prompt,
    subagents=[research_subagent, verifier_subagent],
    middleware=[get_tool_error_middleware()],
)
