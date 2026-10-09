import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from fastapi import HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_memory import Conversation, Message, utc_now
from app.models.analytics import TokenAnalytics



class ChatService:

    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user_id: UUID,
        title: str = "New Chat",
        model: str = "groq",
    ) -> Conversation:
        """Create a new chat conversation session."""
        conversation = Conversation(
            user_id=user_id,
            title=title,
            model=model or "groq",
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation.messages = []
        return conversation

    @staticmethod
    async def get_user_conversations(
        db: AsyncSession,
        user_id: UUID,
        include_messages: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Conversation]:
        """Fetch all conversations for a user ordered by pinned status and updated_at."""
        stmt = (
            select(Conversation)
            .where(
                Conversation.user_id == user_id,
                Conversation.is_archived == False,
                Conversation.messages.any(),
            )
            .order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if include_messages:
            stmt = stmt.options(selectinload(Conversation.messages))

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        load_messages: bool = True,
    ) -> Optional[Conversation]:
        """Fetch a specific conversation owned by user."""
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        if load_messages:
            stmt = stmt.options(selectinload(Conversation.messages))

        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        return conversation

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        title: Optional[str] = None,
        is_pinned: Optional[bool] = None,
        is_archived: Optional[bool] = None,
        model: Optional[str] = None,
    ) -> Optional[Conversation]:
        """Update metadata (title, pinned, archived, model) of a conversation."""
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        if title is not None:
            conversation.title = title.strip()
        if is_pinned is not None:
            conversation.is_pinned = is_pinned
        if is_archived is not None:
            conversation.is_archived = is_archived
        if model is not None:
            conversation.model = model.strip()

        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def delete_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Delete a conversation and all its messages."""
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        await db.delete(conversation)
        await db.commit()

        # Purge AI LangGraph checkpointer memory if present
        try:
            from app.ai.graph import clear_thread_memory
            await clear_thread_memory(str(conversation_id))
        except Exception:
            pass

        return True

    @staticmethod
    async def delete_all_conversations(
        db: AsyncSession,
        user_id: UUID,
    ) -> int:
        """Delete all conversations for a user and clear their checkpointer state."""
        stmt = select(Conversation.id).where(Conversation.user_id == user_id)
        result = await db.execute(stmt)
        conv_ids = list(result.scalars().all())

        delete_stmt = delete(Conversation).where(Conversation.user_id == user_id)
        await db.execute(delete_stmt)
        await db.commit()

        try:
            from app.ai.graph import clear_thread_memory
            for cid in conv_ids:
                await clear_thread_memory(str(cid))
        except Exception:
            pass

        return len(conv_ids)

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: UUID,
        role: str,
        content: str,
        tokens_used: Optional[int] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        """Add a new message to a conversation thread, persisting analytics and token telemetry."""
        now = utc_now()
        meta = dict(extra_metadata) if extra_metadata else {}

        # Ensure tokens_used is computed
        if tokens_used is None or tokens_used <= 0:
            if meta.get("tokens_used"):
                try:
                    tokens_used = int(meta["tokens_used"])
                except (ValueError, TypeError):
                    tokens_used = None
            if not tokens_used or tokens_used <= 0:
                tokens_used = max(15 if role == "assistant" else 5, len(content) // 4)

        prompt_tokens = meta.get("prompt_tokens")
        completion_tokens = meta.get("completion_tokens")

        if role == "assistant":
            if completion_tokens is None:
                completion_tokens = max(10, len(content) // 4)
            if prompt_tokens is None:
                prompt_tokens = max(5, tokens_used - completion_tokens)
            meta["prompt_tokens"] = prompt_tokens
            meta["completion_tokens"] = completion_tokens
            meta["tokens_used"] = tokens_used

            # Enrich provider and model if missing
            if not meta.get("provider") or not meta.get("model"):
                conv = await db.get(Conversation, conversation_id)
                conv_model = getattr(conv, "model", None) or "groq"
                if not meta.get("model"):
                    meta["model"] = conv_model
                if not meta.get("provider"):
                    m_lower = str(conv_model).lower()
                    if "gemini" in m_lower:
                        meta["provider"] = "gemini"
                    elif "gpt" in m_lower or "openai" in m_lower:
                        meta["provider"] = "openai"
                    elif "claude" in m_lower or "anthropic" in m_lower:
                        meta["provider"] = "anthropic"
                    else:
                        meta["provider"] = "groq"
            if "is_custom_key" not in meta:
                meta["is_custom_key"] = bool(
                    meta.get("isCustomKey") or meta.get("custom_chat_key_used")
                )
        else:
            if prompt_tokens is None:
                prompt_tokens = tokens_used
            meta["prompt_tokens"] = prompt_tokens
            meta["tokens_used"] = tokens_used

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tokens_used=tokens_used,
            extra_metadata=meta,
            created_at=now,
        )
        db.add(message)
        
        # Touch conversation updated_at
        stmt = (
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=now)
        )
        await db.execute(stmt)
        await db.commit()
        await db.refresh(message)

        # Store dedicated telemetry record into token_analytics DB table
        if role == "assistant":
            try:
                conv = await db.get(Conversation, conversation_id)
                user_id = conv.user_id if conv else None
                if user_id:
                    provider = str(meta.get("provider") or "groq").lower()
                    model = str(meta.get("model") or "llama-3.3-70b-versatile")
                    is_custom = bool(meta.get("is_custom_key", False))
                    rate = 0.0006 if "groq" in provider else (0.0010 if "gemini" in provider else (0.0040 if "openai" in provider else 0.0020))
                    cost = round((tokens_used / 1000.0) * rate, 6)

                    analytics_record = TokenAnalytics(
                        user_id=user_id,
                        conversation_id=conversation_id,
                        message_id=message.id,
                        provider=provider,
                        model=model,
                        is_custom_key=is_custom,
                        prompt_tokens=prompt_tokens or 0,
                        completion_tokens=completion_tokens or 0,
                        total_tokens=tokens_used,
                        estimated_cost_usd=cost,
                        request_type=meta.get("request_type", "chat"),
                        extra_metadata=meta,
                        created_at=now,
                    )
                    db.add(analytics_record)
                    await db.commit()
            except Exception:
                pass

        return message



    @staticmethod
    async def get_messages(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        limit: int = 100,
    ) -> List[Message]:
        """Fetch messages in a conversation."""
        # Verify ownership
        conversation = await ChatService.get_conversation(db, conversation_id, user_id, load_messages=False)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_token_analytics(
        db: AsyncSession,
        user_id: UUID,
        timeframe: str = "week",
    ) -> Dict[str, Any]:
        """Aggregate token spending, provider & model breakdown, and timeline analytics."""
        now = datetime.now(timezone.utc)
        
        # Calculate time boundary and timeline intervals
        if timeframe == "day":
            start_date = now - timedelta(days=1)
            buckets = []
            for i in range(23, -1, -1):
                bucket_time = now - timedelta(hours=i)
                date_key = bucket_time.strftime("%Y-%m-%d %H:00")
                label = bucket_time.strftime("%H:00")
                buckets.append({
                    "key": date_key,
                    "date": bucket_time.strftime("%Y-%m-%d"),
                    "label": label,
                    "prebuilt_tokens": 0,
                    "custom_tokens": 0,
                    "total_tokens": 0,
                    "requests": 0,
                })
        elif timeframe == "week":
            start_date = now - timedelta(days=7)
            buckets = []
            for i in range(6, -1, -1):
                bucket_time = now - timedelta(days=i)
                date_key = bucket_time.strftime("%Y-%m-%d")
                label = bucket_time.strftime("%a (%b %d)")
                buckets.append({
                    "key": date_key,
                    "date": date_key,
                    "label": label,
                    "prebuilt_tokens": 0,
                    "custom_tokens": 0,
                    "total_tokens": 0,
                    "requests": 0,
                })
        elif timeframe == "month":
            start_date = now - timedelta(days=30)
            buckets = []
            for i in range(29, -1, -1):
                bucket_time = now - timedelta(days=i)
                date_key = bucket_time.strftime("%Y-%m-%d")
                label = bucket_time.strftime("%b %d")
                buckets.append({
                    "key": date_key,
                    "date": date_key,
                    "label": label,
                    "prebuilt_tokens": 0,
                    "custom_tokens": 0,
                    "total_tokens": 0,
                    "requests": 0,
                })
        elif timeframe == "year":
            start_date = now - timedelta(days=365)
            buckets = []
            for i in range(11, -1, -1):
                bucket_time = now - timedelta(days=int(i * 30.5))
                date_key = bucket_time.strftime("%Y-%m")
                label = bucket_time.strftime("%b %Y")
                buckets.append({
                    "key": date_key,
                    "date": date_key,
                    "label": label,
                    "prebuilt_tokens": 0,
                    "custom_tokens": 0,
                    "total_tokens": 0,
                    "requests": 0,
                })
        else:  # "all"
            start_date = None
            buckets = []

        stmt = (
            select(TokenAnalytics, Conversation.title)
            .outerjoin(Conversation, TokenAnalytics.conversation_id == Conversation.id)
            .where(TokenAnalytics.user_id == user_id)
        )
        if start_date:
            stmt = stmt.where(TokenAnalytics.created_at >= start_date)
        stmt = stmt.order_by(TokenAnalytics.created_at.asc())

        result = await db.execute(stmt)
        rows = result.all()

        total_tokens = 0
        prompt_tokens_sum = 0
        completion_tokens_sum = 0
        prebuilt_tokens = 0
        custom_tokens = 0
        total_requests = len(rows)
        prebuilt_requests = 0
        custom_requests = 0
        estimated_cost_usd = 0.0

        provider_map = defaultdict(lambda: {"tokens": 0, "requests": 0, "models": defaultdict(int)})
        model_map = defaultdict(lambda: {"tokens": 0, "requests": 0, "provider": "groq"})
        bucket_dict = {b["key"]: b for b in buckets}
        activity_items = []

        for record, conv_title in rows:
            tokens = record.total_tokens
            if not tokens or tokens <= 0:
                tokens = max(15, (record.prompt_tokens or 0) + (record.completion_tokens or 0))
            
            is_custom = bool(record.is_custom_key)
            provider = str(record.provider or "groq").lower()
            model = str(record.model or "llama-3.3-70b-versatile")

            p_tok = record.prompt_tokens
            c_tok = record.completion_tokens
            if c_tok is None or c_tok <= 0:
                c_tok = max(10, int(tokens * 0.65))
            if p_tok is None or p_tok <= 0:
                p_tok = max(5, tokens - c_tok)

            total_tokens += tokens
            prompt_tokens_sum += p_tok
            completion_tokens_sum += c_tok

            # Cumulative cost
            if record.estimated_cost_usd and record.estimated_cost_usd > 0:
                estimated_cost_usd += record.estimated_cost_usd
            else:
                rate = 0.0006 if "groq" in provider else (0.0010 if "gemini" in provider else (0.0040 if "openai" in provider else 0.0020))
                estimated_cost_usd += (tokens / 1000.0) * rate

            if is_custom:
                custom_tokens += tokens
                custom_requests += 1
            else:
                prebuilt_tokens += tokens
                prebuilt_requests += 1

            provider_map[provider]["tokens"] += tokens
            provider_map[provider]["requests"] += 1
            provider_map[provider]["models"][model] += tokens

            model_map[model]["tokens"] += tokens
            model_map[model]["requests"] += 1
            model_map[model]["provider"] = provider

            activity_items.append({
                "id": record.id,
                "conversation_id": record.conversation_id or record.id,
                "conversation_title": conv_title or "Chat",
                "role": "assistant",
                "provider": provider,
                "model": model,
                "is_custom_key": is_custom,
                "tokens_used": tokens,
                "prompt_tokens": p_tok,
                "completion_tokens": c_tok,
                "created_at": record.created_at,
            })


            # Bucket timeline
            if timeframe == "day":
                key = record.created_at.strftime("%Y-%m-%d %H:00")
            elif timeframe in ["week", "month"]:
                key = record.created_at.strftime("%Y-%m-%d")
            elif timeframe == "year":
                key = record.created_at.strftime("%Y-%m")
            else:
                key = record.created_at.strftime("%Y-%m-%d")


            if key in bucket_dict:
                b = bucket_dict[key]
                b["total_tokens"] += tokens
                b["requests"] += 1
                if is_custom:
                    b["custom_tokens"] += tokens
                else:
                    b["prebuilt_tokens"] += tokens
            elif timeframe == "all":
                if key not in bucket_dict:
                    bucket_dict[key] = {
                        "key": key,
                        "date": key,
                        "label": key,
                        "prebuilt_tokens": 0,
                        "custom_tokens": 0,
                        "total_tokens": 0,
                        "requests": 0,
                    }
                    buckets.append(bucket_dict[key])
                b = bucket_dict[key]
                b["total_tokens"] += tokens
                b["requests"] += 1
                if is_custom:
                    b["custom_tokens"] += tokens
                else:
                    b["prebuilt_tokens"] += tokens

        prebuilt_pct = round((prebuilt_tokens / total_tokens * 100), 1) if total_tokens > 0 else 0.0
        custom_pct = round((custom_tokens / total_tokens * 100), 1) if total_tokens > 0 else 0.0
        avg_tokens = round(total_tokens / total_requests, 1) if total_requests > 0 else 0.0

        provider_list = []
        for p, data in sorted(provider_map.items(), key=lambda x: x[1]["tokens"], reverse=True):
            pct = round((data["tokens"] / total_tokens * 100), 1) if total_tokens > 0 else 0.0
            provider_list.append({
                "provider": p,
                "tokens": data["tokens"],
                "requests": data["requests"],
                "percentage": pct,
                "models": dict(data["models"]),
            })

        model_list = []
        for m, data in sorted(model_map.items(), key=lambda x: x[1]["tokens"], reverse=True):
            pct = round((data["tokens"] / total_tokens * 100), 1) if total_tokens > 0 else 0.0
            model_list.append({
                "model": m,
                "provider": data["provider"],
                "tokens": data["tokens"],
                "requests": data["requests"],
                "percentage": pct,
            })

        top_provider = provider_list[0]["provider"] if provider_list else None
        top_model = model_list[0]["model"] if model_list else None

        timeline = []
        for b in buckets:
            timeline.append({
                "label": b["label"],
                "date": b["date"],
                "prebuilt_tokens": b["prebuilt_tokens"],
                "custom_tokens": b["custom_tokens"],
                "total_tokens": b["total_tokens"],
                "requests": b["requests"],
            })

        # Return latest 20 activities descending
        recent_activity = sorted(activity_items, key=lambda x: x["created_at"], reverse=True)[:20]

        return {
            "timeframe": timeframe,
            "total_tokens": total_tokens,
            "prompt_tokens": prompt_tokens_sum,
            "completion_tokens": completion_tokens_sum,
            "prebuilt_tokens": prebuilt_tokens,
            "custom_tokens": custom_tokens,
            "prebuilt_percentage": prebuilt_pct,
            "custom_percentage": custom_pct,
            "total_requests": total_requests,
            "prebuilt_requests": prebuilt_requests,
            "custom_requests": custom_requests,
            "estimated_cost_usd": round(estimated_cost_usd, 4),
            "avg_tokens_per_request": avg_tokens,
            "top_provider": top_provider,
            "top_model": top_model,
            "providers": provider_list,
            "models": model_list,
            "timeline": timeline,
            "recent_activity": recent_activity,
        }
