from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row

from app.core.config import settings

# Create Async Engine
engine = create_async_engine(
    settings.get_async_database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Create Async Session Local
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Create database tables if they do not exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# psycopg connection pool for LangGraph distributed checkpointer
_pg_pool: Optional[AsyncConnectionPool] = None


def get_postgres_connection_kwargs() -> dict:
    """Connection kwargs required by LangGraph AsyncPostgresSaver."""
    return {
        "autocommit": True,
        "prepare_threshold": 0,
        "row_factory": dict_row,
    }


async def get_pg_pool() -> AsyncConnectionPool:
    """Returns or lazily initializes the shared async connection pool for psycopg / LangGraph."""
    global _pg_pool
    if _pg_pool is None or _pg_pool.closed:
        _pg_pool = AsyncConnectionPool(
            conninfo=settings.DATABASE_URL,
            min_size=2,
            max_size=20,
            kwargs=get_postgres_connection_kwargs(),
            open=False,
        )
        await _pg_pool.open()
    return _pg_pool


async def close_pg_pool() -> None:
    """Gracefully closes the async connection pool on application shutdown."""
    global _pg_pool
    if _pg_pool is not None and not _pg_pool.closed:
        await _pg_pool.close()
        _pg_pool = None

