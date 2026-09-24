import time
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.redis_client import get_redis_client

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint verifying database and Redis connectivity with latency."""
    health_status = {
        "status": "healthy",
        "database": "unknown",
        "redis": "unknown",
        "redis_latency_ms": None,
    }
    is_healthy = True

    # 1. Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = f"unhealthy ({type(e).__name__})"
        is_healthy = False

    # 2. Check Redis
    try:
        start_time = time.perf_counter()
        redis = await get_redis_client()
        pong = await redis.ping()
        latency = (time.perf_counter() - start_time) * 1000
        if pong:
            health_status["redis"] = "healthy"
            health_status["redis_latency_ms"] = round(latency, 2)
        else:
            health_status["redis"] = "unresponsive"
            is_healthy = False
    except Exception as e:
        health_status["redis"] = f"unhealthy ({type(e).__name__})"
        is_healthy = False

    health_status["status"] = "healthy" if is_healthy else "degraded"
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(status_code=status_code, content=health_status)
