import contextvars
from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.chat_models import init_chat_model
from app.core.config import settings

# Request-scoped context variables for Bring Your Own Key (BYOK)
active_chat_api_key_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_chat_api_key", default=None
)
active_chat_provider_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_chat_provider", default=None
)
active_chat_model_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "active_chat_model", default=None
)


def set_active_chat_key(key: Optional[str]) -> None:
    active_chat_api_key_var.set(key.strip() if key and key.strip() else None)


def set_active_chat_provider(provider: Optional[str]) -> None:
    active_chat_provider_var.set(provider.strip() if provider and provider.strip() else None)


def set_active_chat_model(model: Optional[str]) -> None:
    active_chat_model_var.set(model.strip() if model and model.strip() else None)


def get_llm(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
):
    """
    Dynamically initializes an LLM instance.
    - If user provides a custom API key, dispatches to their chosen provider, model, and key.
    - If user does not provide a custom API key (or deletes it), falls back seamlessly to prebuilt system keys.
    """
    effective_key = (api_key or active_chat_api_key_var.get() or "").strip() or None
    chosen_provider = (active_chat_provider_var.get() or provider or "").lower().strip()
    chosen_model = (active_chat_model_var.get() or model_name or "").strip()

    # 1. USER PROVIDED CUSTOM API KEY (BYOK)
    if effective_key:
        if not chosen_provider or chosen_provider in ["auto", "default"]:
            if effective_key.startswith("gsk_"):
                chosen_provider = "groq"
            elif effective_key.startswith("AIzaSy"):
                chosen_provider = "gemini"
            elif effective_key.startswith("sk-or-"):
                chosen_provider = "openrouter"
            elif effective_key.startswith("sk-"):
                chosen_provider = "openai"
            else:
                chosen_provider = "groq"

        if chosen_provider in ["gemini", "google", "google_genai"]:
            model = chosen_model or "gemini-2.0-flash"
            return init_chat_model(
                model,
                model_provider="google_genai",
                temperature=0.2,
                api_key=effective_key,
            )

        if chosen_provider == "openai":
            model = chosen_model or "gpt-4o-mini"
            return init_chat_model(
                model,
                model_provider="openai",
                temperature=0.2,
                api_key=effective_key,
            )

        if chosen_provider == "openrouter":
            model = chosen_model or settings.OPENROUTER_MODEL
            return init_chat_model(
                model,
                model_provider="openai",
                base_url="https://openrouter.ai/api/v1",
                temperature=0.2,
                api_key=effective_key,
            )

        # Default custom provider: groq
        model = chosen_model or settings.GROQ_MODEL
        return init_chat_model(
            model,
            model_provider="groq",
            temperature=0.2,
            api_key=effective_key,
        )

    # 2. PREBUILT FALLBACK: User did NOT provide a custom API key
    if (
        chosen_provider == "openrouter"
        or chosen_model.startswith("openrouter")
        or chosen_model == "qwen"
    ):
        return init_chat_model(
            settings.OPENROUTER_MODEL,
            model_provider="openai",
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2,
            api_key=settings.OPENROUTER_API_KEY,
        )

    # Default prebuilt provider: Groq
    return init_chat_model(
        settings.GROQ_MODEL,
        model_provider="groq",
        temperature=0.2,
        api_key=settings.GROQ_API_KEY,
    )


class DynamicChatModel(BaseChatModel):
    """
    Dynamic chat model that dispatches to the active LLM per async context.
    Allows runtime switching between user custom BYOK keys and prebuilt keys
    without recompiling LangGraph state graphs.
    """
    default_provider: str = "groq"

    def _get_active_model(self):
        active_p = active_chat_provider_var.get()
        return get_llm(provider=active_p or self.default_provider)

    def bind_tools(self, tools, **kwargs):
        return DynamicBoundChatModel(self, tools, kwargs)

    def with_structured_output(self, schema, **kwargs):
        return self._get_active_model().with_structured_output(schema, **kwargs)

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        return self._get_active_model()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)

    async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
        return await self._get_active_model()._agenerate(messages, stop=stop, run_manager=run_manager, **kwargs)

    def _stream(self, messages, stop=None, run_manager=None, **kwargs):
        yield from self._get_active_model()._stream(messages, stop=stop, run_manager=run_manager, **kwargs)

    async def _astream(self, messages, stop=None, run_manager=None, **kwargs):
        async for chunk in self._get_active_model()._astream(messages, stop=stop, run_manager=run_manager, **kwargs):
            yield chunk

    @property
    def _llm_type(self) -> str:
        return "dynamic_chat_model"


class DynamicBoundChatModel(BaseChatModel):
    def __init__(self, parent: DynamicChatModel, tools, bind_kwargs):
        super().__init__()
        self._parent = parent
        self._tools = tools
        self._bind_kwargs = bind_kwargs

    def _get_bound(self):
        return self._parent._get_active_model().bind_tools(self._tools, **self._bind_kwargs)

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        return self._get_bound()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)

    async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
        return await self._get_bound()._agenerate(messages, stop=stop, run_manager=run_manager, **kwargs)

    def _stream(self, messages, stop=None, run_manager=None, **kwargs):
        yield from self._get_bound()._stream(messages, stop=stop, run_manager=run_manager, **kwargs)

    async def _astream(self, messages, stop=None, run_manager=None, **kwargs):
        async for chunk in self._get_bound()._astream(messages, stop=stop, run_manager=run_manager, **kwargs):
            yield chunk

    @property
    def _llm_type(self) -> str:
        return "dynamic_bound_chat_model"


def get_dynamic_chat_model(default_provider: str = "groq") -> DynamicChatModel:
    return DynamicChatModel(default_provider=default_provider)