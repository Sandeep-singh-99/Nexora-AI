import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import (
    get_client_type,
    get_current_user,
)
from app.services.auth import AuthService
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limit_auth, rate_limit_email
from app.models.auth import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="", tags=["Authentication"])


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> str:
    """Helper to attach secure HttpOnly cookies and CSRF token for Web clients."""
    csrf_token = secrets.token_hex(16)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    # CSRF cookie (httponly=False so JS frontends can read and send in X-CSRF-Token header)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return csrf_token


def clear_auth_cookies(response: Response) -> None:
    """Helper to remove authentication cookies on logout."""
    response.delete_cookie(key="access_token", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="csrf_token", domain=settings.COOKIE_DOMAIN)


@router.post("/register", response_model=MessageResponse, dependencies=[Depends(rate_limit_auth)])
async def register(
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email and password."""
    await AuthService.register(db, register_data)
    return MessageResponse(
        message="Registration successful. You can now log in."
    )


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_auth)])
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user. Returns JWT tokens.
    For Web: Sets HttpOnly cookies + CSRF token.
    For Mobile: Returns tokens in JSON payload.
    """
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    user, access_token, refresh_token = await AuthService.authenticate(
        db=db,
        login_data=login_data,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    client_type = get_client_type(request)
    expires_in_sec = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    if client_type == "web":
        set_auth_cookies(response, access_token, refresh_token)
        return TokenResponse(
            access_token=access_token,
            refresh_token=None,  # Do not return in JSON body for Web (cookie only)
            token_type="bearer",
            expires_in=expires_in_sec,
        )
    else:
        # Mobile client
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in_sec,
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    response: Response,
    body: Optional[RefreshRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access and refresh tokens using token rotation and reuse detection.
    Web: Reads refresh_token cookie and sets updated cookies.
    Mobile: Reads refresh_token from JSON request body.
    """
    raw_refresh_token: Optional[str] = None

    if body and body.refresh_token:
        raw_refresh_token = body.refresh_token
    else:
        raw_refresh_token = request.cookies.get("refresh_token")

    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    new_access_token, new_refresh_token = await AuthService.refresh_tokens(
        db=db,
        raw_refresh_token=raw_refresh_token,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    client_type = get_client_type(request)
    expires_in_sec = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    if client_type == "web":
        set_auth_cookies(response, new_access_token, new_refresh_token)
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=None,
            token_type="bearer",
            expires_in=expires_in_sec,
        )
    else:
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=expires_in_sec,
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    body: Optional[RefreshRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """Revoke session and clear authentication cookies."""
    raw_refresh_token: Optional[str] = None
    if body and body.refresh_token:
        raw_refresh_token = body.refresh_token
    else:
        raw_refresh_token = request.cookies.get("refresh_token")

    # Extract access token from Authorization header or cookie for immediate blacklisting
    raw_access_token: Optional[str] = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        raw_access_token = auth_header.split(" ")[1]
    elif request.cookies.get("access_token"):
        raw_access_token = request.cookies.get("access_token")

    await AuthService.logout(
        db,
        raw_refresh_token=raw_refresh_token,
        raw_access_token=raw_access_token,
    )

    clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Retrieve profile of the currently authenticated user."""
    return current_user


@router.post("/forgot-password", response_model=MessageResponse, dependencies=[Depends(rate_limit_email)])
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Initiate password reset. Sends email with password reset token link."""
    await AuthService.forgot_password(db, forgot_data.email)
    return MessageResponse(
        message="If the email address is registered, password reset instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using single-use token and revoke active sessions."""
    await AuthService.reset_password(db, reset_data.token, reset_data.new_password)
    clear_auth_cookies(response)
    return MessageResponse(
        message="Password has been reset successfully. Please log in with your new password."
    )
