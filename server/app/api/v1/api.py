from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    ai,
    chat,
    memory,
)

app_router = APIRouter()

app_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app_router.include_router(ai.router, prefix="/ai", tags=["AI"])
app_router.include_router(chat.router, prefix="/chat", tags=["Chat Storage"])
app_router.include_router(memory.router, prefix="/memory", tags=["Long-Term Memory"])