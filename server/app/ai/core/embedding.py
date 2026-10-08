import contextvars
from typing import Optional
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings

# Request-scoped context variables for Bring Your Own Key (BYOK) embeddings
active_embedding_api_key_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_embedding_api_key", default=None
)
active_embedding_provider_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_embedding_provider", default=None
)
active_embedding_model_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_embedding_model", default=None
)


def set_active_embedding_key(key: Optional[str]) -> None:
    active_embedding_api_key_var.set(key.strip() if key and key.strip() else None)


def set_active_embedding_provider(provider: Optional[str]) -> None:
    active_embedding_provider_var.set(provider.strip() if provider and provider.strip() else None)


def set_active_embedding_model(model: Optional[str]) -> None:
    active_embedding_model_var.set(model.strip() if model and model.strip() else None)


def get_embeddings(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
):
    """
    Returns an embeddings model instance.
    - If user provides a custom embedding key, dispatches to their chosen embedding provider & model.
    - If user does not provide a custom embedding key (or deletes it), seamlessly uses prebuilt Google Gemini embeddings.
    """
    effective_key = (api_key or active_embedding_api_key_var.get() or "").strip() or None
    chosen_provider = (provider or active_embedding_provider_var.get() or "").lower().strip()
    chosen_model = (model or active_embedding_model_var.get() or "").strip()

    # 1. USER PROVIDED CUSTOM EMBEDDING API KEY (BYOK)
    if effective_key:
        if not chosen_provider or chosen_provider in ["auto", "default"]:
            if effective_key.startswith("AIzaSy"):
                chosen_provider = "gemini"
            elif effective_key.startswith("sk-"):
                chosen_provider = "openai"
            else:
                chosen_provider = "gemini"

        if chosen_provider == "openai":
            from langchain_openai import OpenAIEmbeddings
            embed_model = chosen_model or "text-embedding-3-small"
            return OpenAIEmbeddings(
                model=embed_model,
                api_key=effective_key,
                dimensions=768,
            )

        # Default custom embedding: Google Gemini
        embed_model = chosen_model or settings.GOOGLE_EMBEDDING_MODEL
        return GoogleGenerativeAIEmbeddings(
            model=embed_model,
            google_api_key=effective_key,
            output_dimensionality=768,
        )

    # 2. PREBUILT FALLBACK: Prebuilt Google Gemini with system key
    return GoogleGenerativeAIEmbeddings(
        model=settings.GOOGLE_EMBEDDING_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        output_dimensionality=768,
    )