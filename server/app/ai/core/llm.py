from langchain.chat_models import init_chat_model
from app.core.config import settings


def get_llm(provider: str = "groq"):
    if provider == "groq":
        return init_chat_model(
            settings.GROQ_MODEL,
            model_provider="groq",
            temperature=0.2,
            api_key=settings.GROQ_API_KEY,
        )

    if provider == "gemini":
        return init_chat_model(
            settings.GEMINI_MODEL,
            model_provider="google_genai",
            temperature=0.2,
            api_key=settings.GEMINI_API_KEY,
        )

    raise ValueError(f"Unsupported LLM provider: {provider}")