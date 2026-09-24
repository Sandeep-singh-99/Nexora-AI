import asyncio
import logging
import time
from collections import defaultdict, deque
from typing import Dict, Deque
from fastapi import HTTPException, Request, status
from app.core.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class InMemorySlidingWindowRateLimiter:
    """In-memory sliding window fallback rate limiter."""

    def __init__(self, requests_per_window: int = 10, window_seconds: int = 60):
        self.requests_per_window = requests_per_window
        self.window_seconds = window_seconds
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        async with self._lock:
            # Periodic sweep if map grows large to prevent memory leak
            if len(self.requests) > 1000:
                stale_keys = [k for k, q in self.requests.items() if not q or q[-1] < cutoff]
                for k in stale_keys:
                    self.requests.pop(k, None)

            user_requests = self.requests[key]
            while user_requests and user_requests[0] < cutoff:
                user_requests.popleft()

            if len(user_requests) >= self.requests_per_window:
                retry_after = int(user_requests[0] + self.window_seconds - now) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

            user_requests.append(now)


class RedisSlidingWindowRateLimiter:
    """
    Distributed sliding window rate limiter backed by Redis Sorted Sets (ZSET).
    Automatically falls back to in-memory limiter if Redis is unavailable.
    """

    def __init__(self, requests_per_window: int = 10, window_seconds: int = 60):
        self.requests_per_window = requests_per_window
        self.window_seconds = window_seconds
        self.fallback = InMemorySlidingWindowRateLimiter(
            requests_per_window=requests_per_window,
            window_seconds=window_seconds,
        )

    async def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        redis_key = f"ratelimit:{key}"

        try:
            redis = await get_redis_client()
            async with redis.pipeline(transaction=True) as pipe:
                pipe.zremrangebyscore(redis_key, 0, cutoff)
                pipe.zadd(redis_key, {str(now): now})
                pipe.zcard(redis_key)
                pipe.expire(redis_key, self.window_seconds + 5)
                results = await pipe.execute()

            current_count = results[2]

            if current_count > self.requests_per_window:
                # Find oldest entry to compute precise retry_after
                oldest_entries = await redis.zrange(redis_key, 0, 0, withscores=True)
                if oldest_entries:
                    oldest_ts = oldest_entries[0][1]
                    retry_after = max(1, int(oldest_ts + self.window_seconds - now))
                else:
                    retry_after = self.window_seconds

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Redis rate limiter encountered error ({e}); using in-memory fallback.")
            await self.fallback.check(key)


# Global rate limiter instances
auth_rate_limiter = RedisSlidingWindowRateLimiter(requests_per_window=10, window_seconds=60)
email_rate_limiter = RedisSlidingWindowRateLimiter(requests_per_window=5, window_seconds=60)
ai_rate_limiter = RedisSlidingWindowRateLimiter(requests_per_window=30, window_seconds=60)


def get_client_ip(request: Request) -> str:
    """Extract client IP respecting X-Forwarded-For if behind a reverse proxy/load balancer."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
        if client_ip:
            return client_ip
    return request.client.host if request.client else "127.0.0.1"


async def rate_limit_auth(request: Request) -> None:
    client_ip = get_client_ip(request)
    key = f"auth:{client_ip}"
    await auth_rate_limiter.check(key)


async def rate_limit_email(request: Request) -> None:
    client_ip = get_client_ip(request)
    key = f"email:{client_ip}"
    await email_rate_limiter.check(key)


async def rate_limit_ai(request: Request) -> None:
    client_ip = get_client_ip(request)
    key = f"ai:{client_ip}"
    await ai_rate_limiter.check(key)
