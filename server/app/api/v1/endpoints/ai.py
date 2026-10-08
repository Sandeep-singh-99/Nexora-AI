import json
import logging
import asyncio
import uuid
from urllib.parse import urlparse
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.messages import HumanMessage
from app.core.database import get_db, AsyncSessionLocal
from app.core.rate_limit import rate_limit_ai
from app.dependencies.auth import get_optional_current_user
from app.models.auth import User
from app.models.chat_memory import Conversation
from app.schemas.ai import ChatRequest, ChatResponse, DeleteConversationResponse
from app.services.chat_service import ChatService
from app.services.memory_service import MemoryService
from app.ai.graph import ai_graph, clear_thread_memory, memory
from app.ai.guardrails.input_filter import validate_input, AbuseFilterError
from app.ai.rag.vector_store import DocumentVectorStore

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["AI"])


async def build_scoped_message(message: str, user_id: Optional[str], document_id: Optional[str]) -> str:
    """If a document is scoped, fetches its record and builds an unambiguous prompt instruction."""
    if not document_id or not user_id or user_id == "anonymous":
        return message

    try:
        user_uuid = UUID(str(user_id))
        doc_uuid = UUID(str(document_id))
        async with AsyncSessionLocal() as session:
            doc_record = await DocumentVectorStore.get_document_by_id(session, user_uuid, doc_uuid)
            if doc_record:
                return (
                    f"[Active Document Scope: \"{doc_record.filename}\" (ID: {doc_record.id})]\n"
                    f"[CRITICAL MANDATE: The user has explicitly selected and locked the chat to the document \"{doc_record.filename}\". "
                    f"All questions about 'this document', 'this pdf', summaries, key points, or content "
                    f"STRICTLY and EXCLUSIVELY pertain to \"{doc_record.filename}\". "
                    f"Always invoke search_user_documents with document_id=\"{doc_record.id}\". "
                    f"Do NOT use, summarize, or mention any previously discussed documents from earlier in the conversation.]\n\n"
                    f"{message}"
                )
    except Exception as e:
        logger.warning("Could not build scoped document prompt: %s", e)

    return message


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

def extract_clean_text(content) -> str:
    """Safely extracts clean plain-text string from string, part dicts, or part lists across providers."""
    if not content:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, dict):
                if "text" in item and isinstance(item["text"], str):
                    text_parts.append(item["text"])
                elif "content" in item and isinstance(item["content"], str):
                    text_parts.append(item["content"])
                elif "value" in item and isinstance(item["value"], str):
                    text_parts.append(item["value"])
            elif hasattr(item, "text") and isinstance(item.text, str):
                text_parts.append(item.text)
            elif hasattr(item, "content") and isinstance(item.content, str):
                text_parts.append(item.content)
            else:
                text_parts.append(str(item))
        return "".join(text_parts)
    if isinstance(content, dict):
        if "text" in content and isinstance(content["text"], str):
            return content["text"]
        if "content" in content and isinstance(content["content"], str):
            return content["content"]
        if "value" in content and isinstance(content["value"], str):
            return content["value"]
        return ""
    if hasattr(content, "text") and isinstance(content.text, str):
        return content.text
    return str(content)


async def event_generator(
    request: Request,
    message: str,
    thread_id: str,
    user_id: Optional[str] = None,
    document_id: Optional[str] = None,
    custom_chat_key: Optional[str] = None,
    custom_chat_provider: Optional[str] = None,
    custom_chat_model: Optional[str] = None,
    custom_embedding_key: Optional[str] = None,
    custom_embedding_provider: Optional[str] = None,
    custom_embedding_model: Optional[str] = None,
    model: Optional[str] = None,
):
    """Streams thinking steps, search queries & results, guardrails status, and LLM response tokens.
    
    Monitors client connection state to stop execution immediately when the user clicks 'Stop'.
    """
    from app.ai.core.llm import (
        set_active_chat_key,
        set_active_chat_provider,
        set_active_chat_model,
    )
    from app.ai.core.embedding import (
        set_active_embedding_key,
        set_active_embedding_provider,
        set_active_embedding_model,
    )

    # Initialize BYOK ContextVars for this generator execution context
    effective_chat_key = custom_chat_key or request.headers.get("x-custom-chat-key")
    effective_chat_provider = custom_chat_provider or request.headers.get("x-custom-chat-provider")
    effective_chat_model = custom_chat_model or model or request.headers.get("x-custom-chat-model") or request.headers.get("x-custom-model")

    effective_emb_key = custom_embedding_key or request.headers.get("x-custom-embedding-key")
    effective_emb_provider = custom_embedding_provider or request.headers.get("x-custom-embedding-provider")
    effective_emb_model = custom_embedding_model or request.headers.get("x-custom-embedding-model")

    set_active_chat_key(effective_chat_key)
    set_active_chat_provider(effective_chat_provider)
    set_active_chat_model(effective_chat_model)

    set_active_embedding_key(effective_emb_key)
    set_active_embedding_provider(effective_emb_provider)
    set_active_embedding_model(effective_emb_model)

    configurable_dict = {
        "thread_id": thread_id,
        "user_id": user_id or "anonymous",
    }
    if document_id:
        configurable_dict["document_id"] = document_id
    if effective_chat_key:
        configurable_dict["custom_chat_key"] = effective_chat_key
    if effective_chat_provider:
        configurable_dict["custom_chat_provider"] = effective_chat_provider
    if effective_chat_model:
        configurable_dict["custom_chat_model"] = effective_chat_model
    if effective_emb_key:
        configurable_dict["custom_embedding_key"] = effective_emb_key
    if effective_emb_provider:
        configurable_dict["custom_embedding_provider"] = effective_emb_provider
    if effective_emb_model:
        configurable_dict["custom_embedding_model"] = effective_emb_model
    if effective_chat_model:
        configurable_dict["model"] = effective_chat_model

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


    effective_message = await build_scoped_message(message, user_id, document_id)
    input_data = {"messages": [HumanMessage(content=effective_message)]}

    active_search_query = ""
    active_node = ""

    # Notify client if custom API key is being utilized for this response
    if effective_chat_key:
        custom_meta_payload = json.dumps({
            "type": "custom_key_meta",
            "is_custom_key": True,
            "provider": effective_chat_provider or "custom",
            "model": effective_chat_model or "",
        })
        yield f"data: {custom_meta_payload}\n\n"

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
                "memory_retrieval",
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
                        "memory_retrieval": ("Memory Context", "Recalling personal preferences..."),
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
                raw_reasoning = additional_kwargs.get("reasoning_content") or getattr(chunk, "reasoning_content", None)
                reasoning = extract_clean_text(raw_reasoning)

                if reasoning:
                    payload = json.dumps({"type": "thinking", "content": reasoning})
                    yield f"data: {payload}\n\n"
                else:
                    token_text = extract_clean_text(chunk.content)
                    if token_text:
                        payload = json.dumps({"type": "token", "content": token_text})
                        yield f"data: {payload}\n\n"

            # 4. Stream blocked response node message content if graph routed to blocked_response
            elif kind == "on_chain_end" and name == "blocked_response":
                output = event.get("data", {}).get("output", {})
                msgs = output.get("messages", [])
                if msgs:
                    blocked_text = extract_clean_text(msgs[-1].content)
                    if blocked_text:
                        payload = json.dumps({"type": "token", "content": blocked_text})
                        yield f"data: {payload}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'end'})}\n\n"

    except (asyncio.CancelledError, GeneratorExit):
        logger.info("SSE Stream connection cancelled by client for thread %s.", thread_id)
        return
    except Exception as e:
        logger.exception("Streaming error: %s", e)
        is_gemini_quota = (
            ("gemini" in str(e).lower() and ("quota" in str(e).lower() or "429" in str(e).lower() or "resource_exhausted" in str(e).lower()))
            or "gemini_quota_exceeded" in str(e).lower()
        )
        if is_gemini_quota:
            err_payload = json.dumps({
                "type": "error",
                "message": "Google Gemini embedding token quota exceeded. Please wait a moment or check your Gemini API quota.",
                "code": "GEMINI_QUOTA_EXCEEDED",
            })
        else:
            err_payload = json.dumps({"type": "error", "message": str(e)})
        yield f"data: {err_payload}\n\n"


@router.get("/langsmith/status", tags=["AI"])
async def get_langsmith_status():
    """Returns the current LangSmith integration status and connectivity."""
    from app.ai.core.langsmith import check_langsmith_connection
    return check_langsmith_connection()


@router.post("/chat/stream", dependencies=[Depends(rate_limit_ai)])
async def chat_stream(
    request_data: ChatRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """SSE Streaming Endpoint supporting Cancellation, Guardrails, Tavily Search, Thinking, and Tokens."""
    try:
        validate_input(request_data.message)
        thread_id = request_data.thread_id or f"session_{uuid.uuid4()}"
        user_id = str(current_user.id) if current_user else "anonymous"

        chat_key = request_data.custom_chat_key or request.headers.get("x-custom-chat-key")
        chat_provider = request_data.custom_chat_provider or request.headers.get("x-custom-chat-provider")
        chat_model = request_data.custom_chat_model or request_data.model or request.headers.get("x-custom-chat-model") or request.headers.get("x-custom-model")

        emb_key = request_data.custom_embedding_key or request.headers.get("x-custom-embedding-key")
        emb_provider = request_data.custom_embedding_provider or request.headers.get("x-custom-embedding-provider")
        emb_model = request_data.custom_embedding_model or request.headers.get("x-custom-embedding-model")

        from app.ai.core.llm import (
            set_active_chat_key,
            set_active_chat_provider,
            set_active_chat_model,
        )
        from app.ai.core.embedding import (
            set_active_embedding_key,
            set_active_embedding_provider,
            set_active_embedding_model,
        )

        set_active_chat_key(chat_key)
        set_active_chat_provider(chat_provider)
        set_active_chat_model(chat_model)

        set_active_embedding_key(emb_key)
        set_active_embedding_provider(emb_provider)
        set_active_embedding_model(emb_model)

        # Fire background task on every conversation turn to extract new persistent preferences
        if current_user:
            background_tasks.add_task(
                MemoryService.extract_and_save_preferences_task,
                user_id=current_user.id,
                user_text=request_data.message,
            )

        return StreamingResponse(
            event_generator(
                request,
                request_data.message,
                thread_id,
                user_id=user_id,
                document_id=request_data.document_id,
                custom_chat_key=chat_key,
                custom_chat_provider=chat_provider,
                custom_chat_model=chat_model,
                custom_embedding_key=emb_key,
                custom_embedding_provider=emb_provider,
                custom_embedding_model=emb_model,
                model=chat_model,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
            background=background_tasks,
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


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(rate_limit_ai)])
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Standard non-streaming JSON endpoint with pre-flight and graph guardrails."""
    try:
        validate_input(request.message)

        # Fire background task on every conversation turn to extract new persistent preferences
        if current_user:
            background_tasks.add_task(
                MemoryService.extract_and_save_preferences_task,
                user_id=current_user.id,
                user_text=request.message,
            )

        chat_key = request.custom_chat_key
        chat_provider = request.custom_chat_provider
        chat_model = request.custom_chat_model or request.model
        emb_key = request.custom_embedding_key
        emb_provider = request.custom_embedding_provider
        emb_model = request.custom_embedding_model

        from app.ai.core.llm import (
            set_active_chat_key,
            set_active_chat_provider,
            set_active_chat_model,
        )
        from app.ai.core.embedding import (
            set_active_embedding_key,
            set_active_embedding_provider,
            set_active_embedding_model,
        )

        set_active_chat_key(chat_key)
        set_active_chat_provider(chat_provider)
        set_active_chat_model(chat_model)

        set_active_embedding_key(emb_key)
        set_active_embedding_provider(emb_provider)
        set_active_embedding_model(emb_model)

        thread_id = request.thread_id or f"session_{uuid.uuid4()}"
        user_id = str(current_user.id) if current_user else "anonymous"
        configurable_dict = {
            "thread_id": thread_id,
            "user_id": user_id,
        }
        if chat_key:
            configurable_dict["custom_chat_key"] = chat_key
        if chat_provider:
            configurable_dict["custom_chat_provider"] = chat_provider
        if chat_model:
            configurable_dict["custom_chat_model"] = chat_model
            configurable_dict["model"] = chat_model
        if emb_key:
            configurable_dict["custom_embedding_key"] = emb_key
        if emb_provider:
            configurable_dict["custom_embedding_provider"] = emb_provider
        if emb_model:
            configurable_dict["custom_embedding_model"] = emb_model
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

        effective_message = await build_scoped_message(request.message, user_id, request.document_id)
        result = await ai_graph.ainvoke(
            {"messages": [HumanMessage(content=effective_message)]},
            config=config,
        )

        final_response = extract_clean_text(result["messages"][-1].content)

        return ChatResponse(
            response=final_response,
            thread_id=thread_id,
            is_custom_key=bool(chat_key),
            provider=chat_provider if chat_key else None,
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
            try:
                from app.core.redis_cache import invalidate_chat_cache
                await invalidate_chat_cache(conversation_id=parsed_uuid, user_id=current_user.id)
            except Exception:
                pass
        elif current_user:
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