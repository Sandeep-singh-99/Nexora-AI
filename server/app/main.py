from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import app_router
from app.core.config import settings
from app.core.database import init_db
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

    # Perform startup database and Redis initialization
    await init_db()
    await init_redis()
    yield
    # Clean shutdown
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

app.include_router(app_router, prefix="/api/v1", dependencies=[Depends(verify_csrf_protection)])


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to Nexora API",
        "version": settings.VERSION,
    }
