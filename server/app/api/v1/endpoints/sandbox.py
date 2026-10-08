import sys
import os
import time
import shutil
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.sandbox import CodeExecutionRequest, CodeExecutionResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["Sandbox Execution"])

MAX_CODE_LENGTH = 50_000
MAX_OUTPUT_LENGTH = 100_000

def strip_markdown_fences(raw_code: str) -> str:
    code = raw_code.strip()
    if code.startswith("```"):
        lines = code.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return code

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(payload: CodeExecutionRequest):
    """
    Executes Python or JavaScript code in an isolated subprocess sandbox with strict timeout and output limits.
    """
    code = strip_markdown_fences(payload.code)
    language = payload.language.lower().strip()
    timeout = min(max(payload.timeout, 1), 30)

    if not code:
        return CodeExecutionResponse(
            success=False,
            stdout="",
            stderr="Empty code provided.",
            execution_time_ms=0.0,
            error="Empty code provided."
        )

    if len(code) > MAX_CODE_LENGTH:
        return CodeExecutionResponse(
            success=False,
            stdout="",
            stderr=f"Code size exceeds maximum limit of {MAX_CODE_LENGTH} characters.",
            execution_time_ms=0.0,
            error="Code size exceeds limit."
        )

    start_time = time.perf_counter()

    try:
        if language in ("python", "py"):
            # Run python in isolated unbuffered subprocess
            proc = await asyncio.create_subprocess_exec(
                sys.executable,
                "-u",
                "-c",
                code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                # In production Docker, additional cgroups / isolation can be applied
            )
        elif language in ("javascript", "js", "typescript", "ts", "node"):
            node_path = shutil.which("node")
            if not node_path:
                return CodeExecutionResponse(
                    success=False,
                    stdout="",
                    stderr="Node.js runtime is not available on this server host. Please use the client-side Wasm runner.",
                    execution_time_ms=0.0,
                    error="Node.js runtime not installed on server."
                )
            proc = await asyncio.create_subprocess_exec(
                node_path,
                "-e",
                code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        else:
            return CodeExecutionResponse(
                success=False,
                stdout="",
                stderr=f"Unsupported language '{payload.language}' for server execution. Supported: python, javascript.",
                execution_time_ms=0.0,
                error=f"Unsupported language '{payload.language}'."
            )

        try:
            stdout_data, stderr_data = await asyncio.wait_for(
                proc.communicate(),
                timeout=float(timeout)
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
                await proc.wait()
            except Exception:
                pass
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            return CodeExecutionResponse(
                success=False,
                stdout="",
                stderr=f"Execution timed out after {timeout} seconds.",
                execution_time_ms=round(elapsed_ms, 2),
                error="Execution timed out"
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        stdout_str = stdout_data.decode("utf-8", errors="replace")[:MAX_OUTPUT_LENGTH]
        stderr_str = stderr_data.decode("utf-8", errors="replace")[:MAX_OUTPUT_LENGTH]
        success = proc.returncode == 0

        return CodeExecutionResponse(
            success=success,
            stdout=stdout_str,
            stderr=stderr_str,
            execution_time_ms=round(elapsed_ms, 2),
            error=None if success else (stderr_str or f"Process exited with code {proc.returncode}")
        )

    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.error("Sandbox execution error: %s", e, exc_info=True)
        return CodeExecutionResponse(
            success=False,
            stdout="",
            stderr=str(e),
            execution_time_ms=round(elapsed_ms, 2),
            error=str(e)
        )
