import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.database import Base, get_db
from app.main import app
from app.models.auth import PasswordResetToken, User

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


@pytest.mark.asyncio
async def test_full_auth_flow_mobile_and_web():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. User Registration
        reg_payload = {
            "email": "user@example.com",
            "password": "SecurePassword123!",
        }
        res = await client.post("/auth/register", json=reg_payload)
        assert res.status_code == 200, res.text
        assert "Registration successful" in res.json()["message"]

        # Duplicate Registration Attempt -> 400 Bad Request
        res_dup = await client.post("/auth/register", json=reg_payload)
        assert res_dup.status_code == 400

        login_payload = {
            "email": "user@example.com",
            "password": "SecurePassword123!",
        }

        # 2. Mobile Client Login -> Tokens returned in JSON body
        mobile_headers = {"X-Client-Type": "mobile"}
        res = await client.post("/auth/login", json=login_payload, headers=mobile_headers)
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        mobile_access_token = data["access_token"]
        mobile_refresh_token = data["refresh_token"]

        # 3. Access Protected Endpoint /auth/me with Bearer token
        me_headers = {"Authorization": f"Bearer {mobile_access_token}"}
        res = await client.get("/auth/me", headers=me_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "user@example.com"
        assert res.json()["is_verified"] is True

        # 4. Web Client Login -> Tokens returned in HttpOnly cookies
        web_headers = {"X-Client-Type": "web"}
        res = await client.post("/auth/login", json=login_payload, headers=web_headers)
        assert res.status_code == 200
        assert "access_token" in res.cookies
        assert "refresh_token" in res.cookies
        assert "csrf_token" in res.cookies

        # 5. Mobile Refresh Token Rotation
        ref_res = await client.post(
            "/auth/refresh",
            json={"refresh_token": mobile_refresh_token},
            headers=mobile_headers,
        )
        assert ref_res.status_code == 200
        ref_data = ref_res.json()
        new_mobile_access = ref_data["access_token"]
        new_mobile_refresh = ref_data["refresh_token"]

        # 6. Refresh Token REUSE ATTACK DETECTION: Reuse old mobile_refresh_token
        reuse_res = await client.post(
            "/auth/refresh",
            json={"refresh_token": mobile_refresh_token},
            headers=mobile_headers,
        )
        assert reuse_res.status_code == 401
        assert "reuse detected" in reuse_res.json()["detail"].lower()

        # 7. Invalidation check: The new refresh token should also be revoked due to family cancellation!
        family_check_res = await client.post(
            "/auth/refresh",
            json={"refresh_token": new_mobile_refresh},
            headers=mobile_headers,
        )
        assert family_check_res.status_code == 401

        # 8. Logout
        logout_res = await client.post("/auth/logout", headers=mobile_headers)
        assert logout_res.status_code == 200


@pytest.mark.asyncio
async def test_password_reset_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # Register user
        await client.post("/auth/register", json={"email": "reset@example.com", "password": "OldPassword123!"})

        # Request Forgot Password
        forgot_res = await client.post("/auth/forgot-password", json={"email": "reset@example.com"})
        assert forgot_res.status_code == 200

        # Wrong password login fail
        bad_login = await client.post(
            "/auth/login",
            json={"email": "reset@example.com", "password": "WrongPassword!"},
            headers={"X-Client-Type": "mobile"},
        )
        assert bad_login.status_code == 401
