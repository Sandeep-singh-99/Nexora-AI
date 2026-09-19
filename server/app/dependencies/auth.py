from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.auth import User


def get_client_type(request: Request) -> str:
    """
    Detect whether the request originates from a Web or Mobile client.
    Can be explicitly declared via 'X-Client-Type: mobile' or inferred from Authorization header vs Cookies.
    """
    header_client = request.headers.get("x-client-type", "").lower()
    if header_client in ["mobile", "web"]:
        return header_client

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return "mobile"

    return "web"


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Authenticate request using Bearer JWT header (mobile) or access_token cookie (web).
    Returns the authenticated User model.
    """
    token: Optional[str] = None

    # Check Authorization Bearer header first
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    # Fallback to access_token cookie for Web clients
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token, expected_type="access")
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found",
        )

    return user


async def get_current_active_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return current active authenticated user."""
    return current_user


async def get_optional_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Optionally authenticate request. Returns User if valid token is provided, otherwise None.
    Does not raise 401 for unauthenticated requests.
    """
    token: Optional[str] = None

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = decode_token(token, expected_type="access")
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


async def verify_csrf_protection(request: Request) -> None:
    """
    CSRF Protection for Web clients using Double-Submit Cookie pattern on state-changing methods.
    Checks that X-CSRF-Token or X-XSRF-Token header matches csrf_token cookie.
    """
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        client_type = get_client_type(request)
        if client_type == "web" and "access_token" in request.cookies:
            csrf_cookie = request.cookies.get("csrf_token")
            csrf_header = request.headers.get("x-csrf-token") or request.headers.get("x-xsrf-token")

            if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token validation failed.",
                )
