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

    if provider == "openrouter":
        return init_chat_model(
            settings.OPENROUTER_MODEL,
            model_provider="openai",
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2,
            api_key=settings.OPENROUTER_API_KEY,
        )

    if provider == "gemini":
        raise ValueError("Google Gemini chat model has been removed; Google Gemini is exclusively used for embedding.")

    raise ValueError(f"Unsupported LLM provider: {provider}")