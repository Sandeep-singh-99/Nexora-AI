from typing import Optional
from pydantic import BaseModel, Field

class CodeExecutionRequest(BaseModel):
    code: str = Field(..., description="The code snippet to execute")
    language: str = Field("python", description="Language of the code (python, javascript, etc.)")
    timeout: int = Field(10, ge=1, le=30, description="Execution timeout in seconds")

class CodeExecutionResponse(BaseModel):
    success: bool
    stdout: str = ""
    stderr: str = ""
    result: Optional[str] = None
    execution_time_ms: float = 0.0
    error: Optional[str] = None
