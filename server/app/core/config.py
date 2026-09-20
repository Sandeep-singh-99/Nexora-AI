import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Nexora")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/auth")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # JWT & Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30")
    )

    GEMINI_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "")

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL")

    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "")

    TAVILY_SEARCH: str = os.getenv("TAVILY_API_KEY", "")

    # LangSmith Observability & Tracing
    LANGSMITH_TRACING: bool = (
        os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
        or os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    )
    LANGSMITH_API_KEY: str = (
        os.getenv("LANGSMITH_API_KEY", "") or os.getenv("LANGCHAIN_API_KEY", "")
    )
    LANGSMITH_PROJECT: str = (
        os.getenv("LANGSMITH_PROJECT", "") or os.getenv("LANGCHAIN_PROJECT", "Nexora")
    )
    LANGSMITH_ENDPOINT: str = (
        os.getenv("LANGSMITH_ENDPOINT", "")
        or os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
    )

    # Frontend
    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000",
    )

    # Cookies
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_DOMAIN: Optional[str] = os.getenv("COOKIE_DOMAIN") or None
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    @property
    def get_async_database_url(self) -> str:
        """Return database URL compatible with asyncpg."""

        url = self.DATABASE_URL

        if url.startswith("postgresql://"):
            url = url.replace(
                "postgresql://",
                "postgresql+asyncpg://",
                1,
            )
        elif url.startswith("postgres://"):
            url = url.replace(
                "postgres://",
                "postgresql+asyncpg://",
                1,
            )

        if "?" in url:
            base, query = url.split("?", 1)

            params = query.split("&")
            new_params = []

            for param in params:
                if param.startswith("channel_binding="):
                    continue

                if param.startswith("sslmode="):
                    value = param.split("=", 1)[1]
                    new_params.append(f"ssl={value}")
                else:
                    new_params.append(param)

            url = (
                f"{base}?{'&'.join(new_params)}"
                if new_params
                else base
            )

        return url


settings = Settings()


def configure_langsmith() -> None:
    """Ensure LangSmith and LangChain tracing environment variables are properly synchronized."""
    if settings.LANGSMITH_API_KEY:
        tracing_val = "true" if settings.LANGSMITH_TRACING else "false"
        os.environ["LANGCHAIN_TRACING_V2"] = tracing_val
        os.environ["LANGSMITH_TRACING"] = tracing_val
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT
        if settings.LANGSMITH_ENDPOINT:
            os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
            os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT


configure_langsmith()