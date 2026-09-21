import json
import logging
import asyncio
from urllib.parse import urlparse
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.messages import HumanMessage
from app.core.database import get_db
from app.dependencies.auth import get_optional_current_user
from app.models.auth import User
from app.models.chat_memory import Conversation
from app.schemas.ai import ChatRequest, ChatResponse, DeleteConversationResponse
from app.services.chat_service import ChatService
from app.ai.graph import ai_graph, clear_thread_memory, memory
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


def extract_grounding_metadata(metadata: dict) -> list[dict]:
    """Extracts sources from Google Gemini native search grounding metadata."""
    results = []
    if not isinstance(metadata, dict):
        return results

    grounding = (
        metadata.get("grounding_metadata")
        or metadata.get("groundingMetadata")
        or {}
    )
    chunks = (
        grounding.get("grounding_chunks")
        or grounding.get("groundingChunks")
        or []
    )
    for chunk in chunks:
        web = chunk.get("web") or {}
        uri = web.get("uri") or ""
        title = web.get("title") or "Web Source"
        if uri and uri.startswith("http"):
            domain = "web"
            try:
                domain = urlparse(uri).netloc.replace("www.", "")
            except Exception:
                pass
            results.append({
                "title": title,
                "url": uri,
                "snippet": title,
                "source": domain,
            })
    return results


def extract_tavily_results(tool_output) -> list[dict]:
    """Parses Tavily and Google tool outputs (list of dicts, strings, documents, or grounding) into standard search items."""
    results = []
    if not tool_output:
        return results

    raw_items = []
    if isinstance(tool_output, list):
        raw_items = tool_output
    elif isinstance(tool_output, dict):
        # Check if output is Google Grounding metadata or Tavily results
        if "grounding_metadata" in tool_output or "groundingChunks" in tool_output:
            return extract_grounding_metadata(tool_output)
        raw_items = tool_output.get("results") or [tool_output]
    elif isinstance(tool_output, str):
        try:
            parsed = json.loads(tool_output)
            if isinstance(parsed, list):
                raw_items = parsed
            elif isinstance(parsed, dict):
                if "grounding_metadata" in parsed or "groundingChunks" in parsed:
                    return extract_grounding_metadata(parsed)
                raw_items = parsed.get("results") or [parsed]
        except Exception:
            pass

    for item in raw_items:
        if isinstance(item, dict):
            url = item.get("url") or item.get("uri") or item.get("link") or ""
            title = item.get("title") or item.get("name") or "Web Source"
            snippet = item.get("content") or item.get("snippet") or item.get("raw_content") or ""
            domain = "web"
            if url and url.startswith("http"):
                try:
                    domain = urlparse(url).netloc.replace("www.", "")
                except Exception:
                    domain = "web"
            if url:
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "source": domain or "web",
                })
        elif hasattr(item, "page_content"):
            content = getattr(item, "page_content", "")
            meta = getattr(item, "metadata", {}) or {}
            url = meta.get("url") or meta.get("source") or meta.get("uri") or ""
            title = meta.get("title") or "Web Source"
            domain = "web"
            if url and url.startswith("http"):
                try:
                    domain = urlparse(url).netloc.replace("www.", "")
                except Exception:
                    domain = "web"
            if url:
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": content,
                    "source": domain or "web",
                })

    return results


async def event_generator(
    request: Request,
    message: str,
    thread_id: str,
    user_id: Optional[str] = None,
    document_id: Optional[str] = None,
):
    """Streams thinking steps, search queries & results, guardrails status, and LLM response tokens.
    
    Monitors client connection state to stop execution immediately when the user clicks 'Stop'.
    """
    configurable_dict = {
        "thread_id": thread_id,
        "user_id": user_id or "anonymous",
    }
    if document_id:
        configurable_dict["document_id"] = document_id

    config = {
        "configurable": configurable_dict,
        "recursion_limit": 100,
        "run_name": "Nexora Chat Stream",
        "tags": ["nexora", "chat", "streaming"],
        "metadata": {
            "thread_id": thread_id,
            "user_id": user_id or "anonymous",
            "document_id": document_id,
            "source": "api_chat_stream",
        },
    }


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

            # 1. Node / Agent Execution Status Updates
            if kind == "on_chain_start" and name in [
                "input_guardrail",
                "router",
                "chat_agent",
                "coding_agent",
                "math_agent",
                "output_guardrail",
            ]:
                active_node = name
                if name != "output_guardrail":
                    agent_metadata = {
                        "input_guardrail": ("Safety Guardrail", "Evaluating safety policies..."),
                        "router": ("Intent Router", "Analyzing request and assigning agent..."),
                        "chat_agent": ("General Assistant", "Generating response..."),
                        "coding_agent": ("Coding Specialist", "Architecting & writing code..."),
                        "math_agent": ("Math Specialist", "Solving mathematical & symbolic operations..."),
                    }
                    agent_name, label = agent_metadata.get(name, ("AI Assistant", "Processing..."))
                    payload = json.dumps({
                        "type": "status",
                        "node": name,
                        "agent": agent_name,
                        "label": label,
                    })
                    yield f"data: {payload}\n\n"

            # 2a. Document Search (Agentic RAG) Tool Invocation
            elif kind == "on_tool_start" and ("search_user_documents" in name.lower() or "document" in name.lower()):
                raw_input = event.get("data", {}).get("input")
                active_search_query = extract_search_query(raw_input)
                payload = json.dumps({
                    "type": "status",
                    "agent": "Document Assistant",
                    "label": f"Searching uploaded documents for '{active_search_query}'...",
                })
                yield f"data: {payload}\n\n"

            elif kind == "on_tool_end" and ("search_user_documents" in name.lower() or "document" in name.lower()):
                payload = json.dumps({
                    "type": "status",
                    "agent": "Document Assistant",
                    "label": "Evaluated document context & synthesizing answer...",
                })
                yield f"data: {payload}\n\n"

            # 2b. Web Search Tool Invocation (Google Search Grounding / Tavily)
            elif kind == "on_tool_start" and ("search_user_documents" not in name.lower()) and any(k in name.lower() for k in ["search", "google", "tavily", "internet"]):
                raw_input = event.get("data", {}).get("input")
                active_search_query = extract_search_query(raw_input)
                payload = json.dumps({
                    "type": "search",
                    "query": active_search_query,
                    "status": "searching",
                })
                yield f"data: {payload}\n\n"

            elif kind == "on_tool_end" and ("search_user_documents" not in name.lower()) and any(k in name.lower() for k in ["search", "google", "tavily", "internet"]):
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
                "math_agent",
            ]:
                chunk = event["data"]["chunk"]
                
                # Check for Google Grounding metadata in model chunk/response
                response_metadata = getattr(chunk, "response_metadata", {}) or {}
                if "grounding_metadata" in response_metadata or "groundingMetadata" in response_metadata:
                    grounding_sources = extract_grounding_metadata(response_metadata)
                    if grounding_sources:
                        payload = json.dumps({
                            "type": "search",
                            "status": "completed",
                            "results": grounding_sources,
                        })
                        yield f"data: {payload}\n\n"

                additional_kwargs = getattr(chunk, "additional_kwargs", {}) or {}
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


@router.get("/langsmith/status", tags=["AI"])
async def get_langsmith_status():
    """Returns the current LangSmith integration status and connectivity."""
    from app.ai.core.langsmith import check_langsmith_connection
    return check_langsmith_connection()


@router.post("/chat/stream")
async def chat_stream(
    request_data: ChatRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """SSE Streaming Endpoint supporting Cancellation, Guardrails, Tavily Search, Thinking, and Tokens."""
    try:
        validate_input(request_data.message)
        thread_id = request_data.thread_id or "default_session"
        user_id = str(current_user.id) if current_user else "anonymous"

        return StreamingResponse(
            event_generator(
                request,
                request_data.message,
                thread_id,
                user_id=user_id,
                document_id=request_data.document_id,
            ),
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
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Standard non-streaming JSON endpoint with pre-flight and graph guardrails."""
    try:
        validate_input(request.message)

        thread_id = request.thread_id or "default_session"
        user_id = str(current_user.id) if current_user else "anonymous"
        configurable_dict = {
            "thread_id": thread_id,
            "user_id": user_id,
        }
        if request.document_id:
            configurable_dict["document_id"] = request.document_id

        config = {
            "configurable": configurable_dict,
            "recursion_limit": 100,
            "run_name": "Nexora Chat Invoke",
            "tags": ["nexora", "chat", "invoke"],
            "metadata": {
                "thread_id": thread_id,
                "user_id": user_id,
                "document_id": request.document_id,
                "source": "api_chat_invoke",
            },
        }

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


@router.delete("/chat/conversation/{conversation_id}", response_model=DeleteConversationResponse)
@router.delete("/chat/{conversation_id}", response_model=DeleteConversationResponse)
async def delete_ai_chat_conversation(
    conversation_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Delete an AI chat conversation thread.
    Cleans up persistent database conversation records (if user owns it)
    and removes in-memory LangGraph checkpointer state.
    """
    target_id = conversation_id.strip()
    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation ID or thread ID cannot be empty",
        )

    is_uuid = False
    parsed_uuid: Optional[UUID] = None
    try:
        parsed_uuid = UUID(target_id)
        is_uuid = True
    except (ValueError, AttributeError):
        is_uuid = False

    # Check if target matches a persisted database conversation
    if is_uuid and parsed_uuid:
        stmt = select(Conversation).where(Conversation.id == parsed_uuid)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if conversation:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required to delete stored conversation",
                )
            if conversation.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this conversation",
                )
            # Delete conversation and all cascading messages
            await ChatService.delete_conversation(
                db=db,
                conversation_id=parsed_uuid,
                user_id=current_user.id,
            )
        elif current_user and target_id not in getattr(memory, "storage", {}):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

    # Purge checkpointer memory from LangGraph
    await clear_thread_memory(target_id)

    return DeleteConversationResponse(
        success=True,
        message="AI chat conversation deleted successfully",
        thread_id=target_id,
    )