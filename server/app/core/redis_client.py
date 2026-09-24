import asyncio
import logging
from typing import Optional
from redis.asyncio import ConnectionPool, Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[Redis] = None
_pool_loop: Optional[asyncio.AbstractEventLoop] = None


def get_redis_pool() -> ConnectionPool:
    """Creates or returns the active asynchronous Redis ConnectionPool tied to the current event loop."""
    global _redis_pool, _pool_loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _redis_pool is None or _pool_loop is not current_loop:
        _pool_loop = current_loop
        pool_kwargs = {
            "host": settings.REDIS_HOST,
            "port": settings.REDIS_PORT,
            "username": settings.REDIS_USER or None,
            "password": settings.REDIS_PASSWORD or None,
            "decode_responses": True,
            "max_connections": 20,
            "socket_connect_timeout": 5.0,
            "socket_timeout": 5.0,
        }
        if settings.REDIS_SSL:
            from redis.asyncio.connection import SSLConnection
            pool_kwargs["connection_class"] = SSLConnection

        _redis_pool = ConnectionPool(**pool_kwargs)
    return _redis_pool


async def get_redis_client() -> Redis:
    """FastAPI dependency or helper to acquire an async Redis client for the current event loop."""
    global _redis_client, _pool_loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _redis_client is None or _pool_loop is not current_loop:
        pool = get_redis_pool()
        _redis_client = Redis(connection_pool=pool)
    return _redis_client


async def ping_redis() -> bool:
    """Non-blocking check to verify Redis connectivity."""
    try:
        client = await get_redis_client()
        return bool(await client.ping())
    except Exception as e:
        logger.warning(f"Redis ping failed: {e}")
        return False


async def init_redis() -> None:
    """Called on application startup to verify Redis connection."""
    try:
        is_alive = await ping_redis()
        if is_alive:
            logger.info("Successfully connected to Redis.")
        else:
            logger.warning("Redis is unreachable at startup. System will use fallbacks.")
    except Exception as e:
        logger.warning(f"Error during Redis startup check: {e}")


async def close_redis() -> None:
    """Called on application shutdown to cleanly close connections."""
    global _redis_client, _redis_pool, _pool_loop
    if _redis_client:
        try:
            await _redis_client.close()
        except Exception:
            pass
        _redis_client = None
    if _redis_pool:
        try:
            await _redis_pool.disconnect()
        except Exception:
            pass
        _redis_pool = None
    _pool_loop = None
    logger.info("Redis connection pool closed.")