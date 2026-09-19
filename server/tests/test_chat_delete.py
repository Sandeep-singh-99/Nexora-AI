import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.auth import User
from app.models.chat_memory import Conversation, Message
from app.ai.graph import memory

# In-memory SQLite for async tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def override_get_db():
    async with TestAsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def auth_headers():
    def _create_headers(user_id: uuid.UUID) -> dict:
        token = create_access_token(user_id, jti=str(uuid.uuid4()))
        return {"Authorization": f"Bearer {token}"}
    return _create_headers


@pytest.mark.asyncio
async def test_delete_ai_chat_conversation_routes(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. Create a user
        async with TestAsyncSessionLocal() as session:
            user = User(
                id=uuid.uuid4(),
                email="alice@example.com",
                hashed_password=hash_password("Secret123!"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.commit()
            user_id = user.id

        headers = auth_headers(user_id)

        # 2. Create a conversation with a message
        async with TestAsyncSessionLocal() as session:
            conv = Conversation(
                id=uuid.uuid4(),
                user_id=user_id,
                title="Testing AI Conversation",
            )
            session.add(conv)
            await session.commit()
            conv_id = conv.id

            msg = Message(
                id=uuid.uuid4(),
                conversation_id=conv_id,
                role="user",
                content="Hello AI!",
            )
            session.add(msg)
            await session.commit()

        # Place state in LangGraph checkpointer memory
        thread_id = str(conv_id)
        memory.storage[thread_id] = {"dummy_checkpoint": 123}
        assert thread_id in memory.storage

        # 3. Call DELETE /ai/chat/{thread_id}
        res = await client.delete(f"/ai/chat/{thread_id}", headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["success"] is True
        assert data["thread_id"] == thread_id
        assert "deleted successfully" in data["message"]

        # Verify DB conversation and messages are removed
        async with TestAsyncSessionLocal() as session:
            db_conv = (await session.execute(select(Conversation).where(Conversation.id == conv_id))).scalar_one_or_none()
            assert db_conv is None
            db_msg = (await session.execute(select(Message).where(Message.conversation_id == conv_id))).scalars().all()
            assert len(db_msg) == 0

        # Verify memory checkpointer is cleared
        assert thread_id not in memory.storage


@pytest.mark.asyncio
async def test_delete_ai_chat_conversation_alias_route(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # Create user & conversation
        async with TestAsyncSessionLocal() as session:
            user = User(
                id=uuid.uuid4(),
                email="bob@example.com",
                hashed_password=hash_password("Secret123!"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.commit()
            user_id = user.id

            conv = Conversation(
                id=uuid.uuid4(),
                user_id=user_id,
                title="Alias Route Test",
            )
            session.add(conv)
            await session.commit()
            conv_id = conv.id

        headers = auth_headers(user_id)
        thread_id = str(conv_id)
        memory.storage[thread_id] = {"checkpoint": 456}

        # Call DELETE /ai/chat/conversation/{conversation_id}
        res = await client.delete(f"/ai/chat/conversation/{conv_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert thread_id not in memory.storage


@pytest.mark.asyncio
async def test_delete_ai_chat_in_memory_session():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        thread_id = "guest_session_999"
        memory.storage[thread_id] = {"guest_state": True}
        assert thread_id in memory.storage

        res = await client.delete(f"/ai/chat/{thread_id}")
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert thread_id not in memory.storage


@pytest.mark.asyncio
async def test_delete_other_user_conversation_forbidden(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # Create two users
        async with TestAsyncSessionLocal() as session:
            user1 = User(
                id=uuid.uuid4(),
                email="user1@example.com",
                hashed_password=hash_password("Secret123!"),
                is_active=True,
                is_verified=True,
            )
            user2 = User(
                id=uuid.uuid4(),
                email="user2@example.com",
                hashed_password=hash_password("Secret123!"),
                is_active=True,
                is_verified=True,
            )
            session.add_all([user1, user2])
            await session.commit()

            conv = Conversation(
                id=uuid.uuid4(),
                user_id=user1.id,
                title="User 1 Private Chat",
            )
            session.add(conv)
            await session.commit()
            conv_id = conv.id

        user2_headers = auth_headers(user2.id)

        # User 2 tries to delete User 1's conversation -> 403 Forbidden
        res = await client.delete(f"/ai/chat/{conv_id}", headers=user2_headers)
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_delete_all_conversations_endpoint(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        async with TestAsyncSessionLocal() as session:
            user = User(
                id=uuid.uuid4(),
                email="carol@example.com",
                hashed_password=hash_password("Secret123!"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.commit()

            c1 = Conversation(id=uuid.uuid4(), user_id=user.id, title="Chat 1")
            c2 = Conversation(id=uuid.uuid4(), user_id=user.id, title="Chat 2")
            session.add_all([c1, c2])
            await session.commit()

            memory.storage[str(c1.id)] = {"state": 1}
            memory.storage[str(c2.id)] = {"state": 2}

        headers = auth_headers(user.id)
        res = await client.delete("/chat/conversations", headers=headers)
        assert res.status_code == 200
        assert res.json()["count"] == 2

        assert str(c1.id) not in memory.storage
        assert str(c2.id) not in memory.storage
