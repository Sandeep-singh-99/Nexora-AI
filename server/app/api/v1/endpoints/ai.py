import json
import logging
import asyncio
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from langchain_core.messages import HumanMessage
from app.schemas.ai import ChatRequest, ChatResponse
from app.ai.graph import ai_graph
from app.ai.guardrails.input_filter import validate_input, AbuseFilterError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["AI"])


def extract_search_query(tool_input) -> str:
    """Safely extracts search query string from LangChain tool input."""
    if isinstance(tool_input, str):
        return tool_input
    if isinstance(tool_input, dict):
        return str(tool_input.get("query") or tool_input.get("input") or tool_input)
    return str(tool_input or "")


def extract_tavily_results(tool_output) -> list[dict]:
    """Parses Tavily tool outputs (list of dicts, strings, or documents) into standard search items."""
    results = []
    if not tool_output:
        return results

    raw_items = []
    if isinstance(tool_output, list):
        raw_items = tool_output
    elif isinstance(tool_output, dict):
        raw_items = tool_output.get("results") or [tool_output]
    elif isinstance(tool_output, str):
        try:
            parsed = json.loads(tool_output)
            if isinstance(parsed, list):
                raw_items = parsed
            elif isinstance(parsed, dict):
                raw_items = parsed.get("results") or [parsed]
        except Exception:
            pass

    for item in raw_items:
        if isinstance(item, dict):
            url = item.get("url", "")
            title = item.get("title") or item.get("name") or "Web Source"
            snippet = item.get("content") or item.get("snippet") or item.get("raw_content") or ""
            domain = "web"
            if url and url.startswith("http"):
                try:
                    domain = urlparse(url).netloc.replace("www.", "")
                except Exception:
                    domain = "web"
            results.append({
                "title": title,
                "url": url,
                "snippet": snippet,
                "source": domain or "web",
            })
        elif hasattr(item, "page_content"):
            content = getattr(item, "page_content", "")
            meta = getattr(item, "metadata", {}) or {}
            url = meta.get("url") or meta.get("source") or ""
            title = meta.get("title") or "Web Source"
            domain = "web"
            if url and url.startswith("http"):
                try:
                    domain = urlparse(url).netloc.replace("www.", "")
                except Exception:
                    domain = "web"
            results.append({
                "title": title,
                "url": url,
                "snippet": content,
                "source": domain or "web",
            })

    return results


async def event_generator(request: Request, message: str, thread_id: str):
    """Streams thinking steps, Tavily search queries & results, guardrails status, and LLM response tokens.
    
    Monitors client connection state to stop execution immediately when the user clicks 'Stop'.
    """
    config = {"configurable": {"thread_id": thread_id}}
    input_data = {"messages": [HumanMessage(content=message)]}

    active_search_query = ""
    active_node = ""

    try:
        # Stream events from LangGraph
        async for event in ai_graph.astream_events(input_data, config=config, version="v2"):
            # Detect client disconnect / Stop button click
            if await request.is_disconnected():
                logger.info("Client cancelled stream. Terminating LangGraph execution for thread %s.", thread_id)
                break

            kind = event.get("event")
            name = event.get("name", "")

            # 1. Node Execution Status Updates
            if kind == "on_chain_start" and name in [
                "input_guardrail",
                "router",
                "chat_agent",
                "coding_agent",
                "research_agent",
                "math_agent",
                "output_guardrail",
            ]:
                active_node = name
                labels = {
                    "input_guardrail": "Evaluating safety policies...",
                    "router": "Analyzing request intent...",
                    "chat_agent": "Generating response...",
                    "coding_agent": "Architecting & writing code...",
                    "research_agent": "Conducting deep research via Tavily...",
                    "math_agent": "Solving mathematical & symbolic operations...",
                    "output_guardrail": "Verifying response integrity...",
                }
                payload = json.dumps({"type": "status", "node": name, "label": labels.get(name, "Processing...")})
                yield f"data: {payload}\n\n"

            # 2. Tavily Web Search Tool Invocation Start & End
            elif kind == "on_tool_start" and ("search" in name.lower() or "tavily" in name.lower()):
                raw_input = event.get("data", {}).get("input")
                active_search_query = extract_search_query(raw_input)
                payload = json.dumps({
                    "type": "search",
                    "query": active_search_query,
                    "status": "searching",
                })
                yield f"data: {payload}\n\n"

            elif kind == "on_tool_end" and ("search" in name.lower() or "tavily" in name.lower()):
                raw_output = event.get("data", {}).get("output")
                parsed_results = extract_tavily_results(raw_output)
                payload = json.dumps({
                    "type": "search",
                    "status": "completed",
                    "query": active_search_query,
                    "results": parsed_results,
                })
                yield f"data: {payload}\n\n"

            # 2b. Time Tool Invocation End (Generative UI payload stream)
            elif kind == "on_tool_end" and ("time" in name.lower() or "get_current_time" in name.lower()):
                raw_output = str(event.get("data", {}).get("output", ""))
                raw_input = event.get("data", {}).get("input", {})
                loc_name = "Tokyo, Japan"
                if isinstance(raw_input, dict):
                    loc_name = str(raw_input.get("timezone") or raw_input.get("location") or raw_input.get("city") or "Tokyo, Japan")
                elif isinstance(raw_input, str):
                    loc_name = raw_input

                city_country_map = {
                    "tokyo": ("Tokyo, Japan", "Asia/Tokyo", "+09:00 (JST)", "🇯🇵"),
                    "japan": ("Tokyo, Japan", "Asia/Tokyo", "+09:00 (JST)", "🇯🇵"),
                    "delhi": ("New Delhi, India", "Asia/Kolkata", "+05:30 (IST)", "🇮🇳"),
                    "india": ("New Delhi, India", "Asia/Kolkata", "+05:30 (IST)", "🇮🇳"),
                    "kolkata": ("New Delhi, India", "Asia/Kolkata", "+05:30 (IST)", "🇮🇳"),
                    "london": ("London, UK", "Europe/London", "+00:00 (GMT)", "🇬🇧"),
                    "uk": ("London, UK", "Europe/London", "+00:00 (GMT)", "🇬🇧"),
                    "york": ("New York, USA", "America/New_York", "-05:00 (EST)", "🇺🇸"),
                    "dubai": ("Dubai, UAE", "Asia/Dubai", "+04:00 (GST)", "🇦🇪"),
                    "singapore": ("Singapore", "Asia/Singapore", "+08:00 (SGT)", "🇸🇬"),
                }

                display_loc = loc_name
                tz_id = loc_name
                offset_str = "UTC Offset"
                flag_emoji = "📍"

                for k, v in city_country_map.items():
                    if k in loc_name.lower():
                        display_loc, tz_id, offset_str, flag_emoji = v
                        break

                ui_payload = json.dumps({
                    "type": "ui",
                    "ui": {
                        "type": "time",
                        "props": {
                            "location": display_loc,
                            "flag": flag_emoji,
                            "time": raw_output,
                            "timezone": tz_id,
                            "offset": offset_str,
                        }
                    }
                })
                yield f"data: {ui_payload}\n\n"

            # 2c. Math Tool Invocation End (Generative UI payload stream)
            elif kind == "on_tool_end" and ("math" in name.lower() or "math_tool" in name.lower()):
                raw_output = event.get("data", {}).get("output", "")
                try:
                    math_data = json.loads(raw_output) if isinstance(raw_output, str) else raw_output
                    if isinstance(math_data, dict) and math_data.get("success"):
                        ui_payload = json.dumps({
                            "type": "ui",
                            "ui": {
                                "type": "math",
                                "props": {
                                    "operation": math_data.get("operation"),
                                    "expression": math_data.get("input"),
                                    "result": math_data.get("result"),
                                    "latex": math_data.get("latex"),
                                    "steps": math_data.get("steps", []),
                                }
                            }
                        })
                        yield f"data: {ui_payload}\n\n"
                except Exception:
                    pass

            # 3. LLM Thinking & Reasoning Tokens (Only for responder agents)
            elif kind == "on_chat_model_stream" and active_node in [
                "chat_agent",
                "coding_agent",
                "research_agent",
                "math_agent",
            ]:
                chunk = event["data"]["chunk"]
                
                additional_kwargs = getattr(chunk, "additional_kwargs", {})
                reasoning = additional_kwargs.get("reasoning_content") or getattr(chunk, "reasoning_content", None)

                if reasoning:
                    payload = json.dumps({"type": "thinking", "content": reasoning})
                    yield f"data: {payload}\n\n"

                elif chunk.content:
                    payload = json.dumps({"type": "token", "content": chunk.content})
                    yield f"data: {payload}\n\n"

            # 4. Stream blocked response node message content if graph routed to blocked_response
            elif kind == "on_chain_end" and name == "blocked_response":
                output = event.get("data", {}).get("output", {})
                msgs = output.get("messages", [])
                if msgs:
                    blocked_text = msgs[-1].content
                    payload = json.dumps({"type": "token", "content": blocked_text})
                    yield f"data: {payload}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'end'})}\n\n"

    except (asyncio.CancelledError, GeneratorExit):
        logger.info("SSE Stream connection cancelled by client for thread %s.", thread_id)
        return
    except Exception as e:
        logger.exception("Streaming error: %s", e)
        err_payload = json.dumps({"type": "error", "message": str(e)})
        yield f"data: {err_payload}\n\n"


@router.post("/chat/stream")
async def chat_stream(request_data: ChatRequest, request: Request):
    """SSE Streaming Endpoint supporting Cancellation, Guardrails, Tavily Search, Thinking, and Tokens."""
    try:
        validate_input(request_data.message)
        thread_id = request_data.thread_id or "default_session"

        return StreamingResponse(
            event_generator(request, request_data.message, thread_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except AbuseFilterError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": e.code, "message": e.message},
        )
    except Exception as e:
        logger.exception("AI Stream execution error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"AI request failed: {str(e)}",
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Standard non-streaming JSON endpoint with pre-flight and graph guardrails."""
    try:
        validate_input(request.message)

        thread_id = request.thread_id or "default_session"
        config = {"configurable": {"thread_id": thread_id}}

        result = await ai_graph.ainvoke(
            {"messages": [HumanMessage(content=request.message)]},
            config=config,
        )

        final_response = result["messages"][-1].content

        return ChatResponse(
            response=str(final_response),
            thread_id=thread_id,
        )

    except AbuseFilterError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": e.code, "message": e.message},
        )
    except Exception as e:
        logger.exception("AI Graph execution error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"AI request failed: {str(e)}",
        )