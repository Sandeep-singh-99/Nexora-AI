import logging
from langchain.chat_models import init_chat_model
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_llm(provider: str = "groq"):
    """Initializes LLM model instance with automatic fallback for rate limits (TPM/RPM limits)."""
    models = []

    # 1. Primary Groq Model
    if provider == "groq" or not settings.GEMINI_API_KEY:
        groq_model_name = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        try:
            primary_groq = init_chat_model(
                groq_model_name,
                model_provider="groq",
                temperature=0.2,
                api_key=settings.GROQ_API_KEY,
            )
            models.append(primary_groq)

            # Secondary fallback Groq model with higher rate limits (30,000 TPM limit)
            if groq_model_name != "llama3-8b-8192":
                fallback_groq = init_chat_model(
                    "llama3-8b-8192",
                    model_provider="groq",
                    temperature=0.2,
                    api_key=settings.GROQ_API_KEY,
                )
                models.append(fallback_groq)
        except Exception as e:
            logger.warning("Failed to initialize Groq model: %s", e)

    # 2. Google Gemini Fallback Model (1,000,000 Token Limit)
    if settings.GEMINI_API_KEY:
        try:
            gemini_model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
            gemini_llm = init_chat_model(
                gemini_model_name,
                model_provider="google_genai",
                temperature=0.2,
                api_key=settings.GEMINI_API_KEY,
            )
            if provider == "gemini":
                models.insert(0, gemini_llm)
            else:
                models.append(gemini_llm)
        except Exception as e:
            logger.warning("Failed to initialize Gemini model: %s", e)

    if not models:
        raise ValueError("No valid LLM API key or model provider configured.")

    if len(models) == 1:
        return models[0]

    # Return primary model with automatic fallbacks for 413 / 429 rate limits
    return models[0].with_fallbacks(models[1:])