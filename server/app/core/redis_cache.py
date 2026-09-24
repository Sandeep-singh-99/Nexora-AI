import json
import logging
from typing import Any, Optional
from app.core.redis_client import get_redis_client

logger = logging.getLogger(__name__)


async def get_cache(key: str) -> Optional[Any]:
    """Retrieve and deserialize a JSON-encoded value from Redis cache."""
    try:
        redis = await get_redis_client()
        raw = await redis.get(key)
        if raw is not None:
            return json.loads(raw)
        return None
    except Exception as e:
        logger.warning(f"Cache get error for key '{key}': {e}")
        return None


async def set_cache(key: str, value: Any, expire_seconds: int = 3600) -> bool:
    """Serialize and store a value in Redis cache with an expiration in seconds."""
    try:
        redis = await get_redis_client()
        payload = json.dumps(value, default=str)
        await redis.set(key, payload, ex=expire_seconds)
        return True
    except Exception as e:
        logger.warning(f"Cache set error for key '{key}': {e}")
        return False


async def delete_cache(key: str) -> bool:
    """Delete a key from Redis cache."""
    try:
        redis = await get_redis_client()
        await redis.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete error for key '{key}': {e}")
        return False


async def clear_cache_pattern(pattern: str) -> int:
    """Scan and delete all keys matching a specific pattern."""
    try:
        redis = await get_redis_client()
        deleted_count = 0
        async for key in redis.scan_iter(match=pattern):
            await redis.delete(key)
            deleted_count += 1
        return deleted_count
    except Exception as e:
        logger.warning(f"Cache clear error for pattern '{pattern}': {e}")
        return 0


async def invalidate_chat_cache(conversation_id: Optional[Any] = None, user_id: Optional[Any] = None) -> None:
    """Invalidates cached conversation threads, message histories, and user conversation lists."""
    try:
        if conversation_id:
            await clear_cache_pattern(f"cache:conversation:{conversation_id}*")
            await clear_cache_pattern(f"cache:messages:{conversation_id}*")
        if user_id:
            await clear_cache_pattern(f"cache:user_convs:{user_id}*")
    except Exception as e:
        logger.warning(f"Error invalidating chat cache: {e}")
