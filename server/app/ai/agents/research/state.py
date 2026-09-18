from typing import Annotated, Sequence, Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class ResearchPlan(BaseModel):
    """Structured plan containing core topic and decomposed inquiry angles."""
    core_topic: str = Field(description="The primary research subject or inquiry.")
    inquiry_angles: List[str] = Field(
        description="3 to 5 distinct sub-questions or technical angles to investigate."
    )


class EvaluationResult(BaseModel):
    """Evaluation decision and polish assessment from the quality subagent."""
    is_approved: bool = Field(
        description="True if the report meets publication standards, False if revision is needed."
    )
    critique: str = Field(
        description="Constructive critique, missing areas, or editorial suggestions."
    )
    final_polished_report: Optional[str] = Field(
        default=None,
        description="The final polished Markdown report if approved."
    )


class ResearchGraphState(TypedDict):
    """State schema for the Research Agent workflow pipeline."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    core_topic: str
    inquiry_angles: List[str]
    raw_research: str
    verified_findings: str
    draft_report: str
    critique: Optional[str]
    iteration_count: int
    final_output: str
