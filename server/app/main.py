import sys
import asyncio

# Psycopg async operations on Windows require the WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import app_router
from app.api.v1.endpoints.health import router as health_router
from app.core.config import settings
from app.core.database import init_db, close_pg_pool
from app.core.redis_client import init_redis, close_redis
from app.dependencies.auth import verify_csrf_protection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    if settings.COOKIE_SECURE and (
        not settings.JWT_SECRET_KEY
        or "dev-secret-key" in settings.JWT_SECRET_KEY
        or len(settings.JWT_SECRET_KEY) < 32
    ):
        raise RuntimeError(
            "FATAL: A strong, unique JWT_SECRET_KEY (min 32 characters) must be configured in production!"
        )

    # Perform startup database, Redis, and checkpointer initialization
    await init_db()
    await init_redis()
    try:
        from app.ai.graph import init_graph_checkpointer
        await init_graph_checkpointer()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Distributed checkpointer eager init warning: %s", e)

    yield
    # Clean shutdown
    await close_pg_pool()
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Configure CORS Middleware for Web clients
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]
allowed_origins = list({o.strip() for o in origins if o and o.strip()})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check at root level (/health)
app.include_router(health_router)

app.include_router(app_router, prefix="/api/v1", dependencies=[Depends(verify_csrf_protection)])


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to Nexora API",
        "version": settings.VERSION,
    }
