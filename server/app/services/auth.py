import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.auth import PasswordResetToken, RefreshSession, User
from app.schemas.auth import LoginRequest, RegisterRequest


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:

    @staticmethod
    async def register(db: AsyncSession, register_data: RegisterRequest) -> User:
        """Register a new user directly as active and verified."""
        # Check if email is already registered
        stmt = select(User).where(User.email == register_data.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered.",
            )

        hashed = hash_password(register_data.password)
        new_user = User(
            email=register_data.email,
            hashed_password=hashed,
            is_active=True,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return new_user

    @staticmethod
    async def authenticate(
        db: AsyncSession,
        login_data: LoginRequest,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        """Authenticate user, create session, and return access/refresh token pair."""
        stmt = select(User).where(User.email == login_data.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        # Generic authentication failure to prevent user enumeration
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive.",
            )

        jti = str(uuid.uuid4())
        family_id = uuid.uuid4()
        access_token = create_access_token(user.id, jti)
        refresh_token = create_refresh_token(user.id, jti)

        session_expires_at = utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_session = RefreshSession(
            user_id=user.id,
            refresh_token_hash=hash_token(jti),
            family_id=family_id,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address,
            expires_at=session_expires_at,
            is_revoked=False,
        )
        db.add(refresh_session)
        await db.commit()

        return user, access_token, refresh_token

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession,
        raw_refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Refresh access & refresh tokens with rotation and reuse detection.
        If a revoked token is used, revoke the entire session family tree.
        """
        try:
            payload = decode_token(raw_refresh_token, expected_type="refresh")
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user_id = UUID(payload["sub"])
        jti = payload["jti"]
        jti_hash = hash_token(jti)

        stmt = select(RefreshSession).where(RefreshSession.refresh_token_hash == jti_hash)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh session not found",
            )

        # REUSE DETECTION: If token is already revoked, attack suspected! Revoke entire family.
        if session.is_revoked:
            await db.execute(
                update(RefreshSession)
                .where(RefreshSession.family_id == session.family_id)
                .values(is_revoked=True)
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Revoked refresh token reuse detected. All sessions terminated.",
            )

        if ensure_utc(session.expires_at) < utc_now():
            session.is_revoked = True
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        # Revoke current session for token rotation
        session.is_revoked = True

        # Generate new token pair
        new_jti = str(uuid.uuid4())
        new_access_token = create_access_token(user_id, new_jti)
        new_refresh_token = create_refresh_token(user_id, new_jti)

        new_session = RefreshSession(
            user_id=user_id,
            refresh_token_hash=hash_token(new_jti),
            family_id=session.family_id,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address,
            expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            is_revoked=False,
        )
        db.add(new_session)
        await db.commit()

        return new_access_token, new_refresh_token

    @staticmethod
    async def logout(
        db: AsyncSession,
        raw_refresh_token: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Revoke session upon user logout."""
        if raw_refresh_token:
            try:
                payload = decode_token(raw_refresh_token, expected_type="refresh")
                jti_hash = hash_token(payload["jti"])
                stmt = select(RefreshSession).where(RefreshSession.refresh_token_hash == jti_hash)
                result = await db.execute(stmt)
                session = result.scalar_one_or_none()
                if session:
                    session.is_revoked = True
                    await db.commit()
                    return
            except jwt.PyJWTError:
                pass

        if user_id:
            await db.execute(
                update(RefreshSession)
                .where(RefreshSession.user_id == user_id, RefreshSession.is_revoked.is_(False))
                .values(is_revoked=True)
            )
            await db.commit()

    @staticmethod
    async def forgot_password(db: AsyncSession, email: str) -> None:
        """Initiate password reset flow for user if account exists."""
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            raw_token = generate_secure_token()
            token_h = hash_token(raw_token)
            expires_at = utc_now() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

            reset_record = PasswordResetToken(
                user_id=user.id,
                token_hash=token_h,
                expires_at=expires_at,
            )
            db.add(reset_record)
            await db.commit()

    @staticmethod
    async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> None:
        """Reset user password, invalidate reset token, and revoke all active refresh sessions."""
        token_h = hash_token(raw_token)
        now = utc_now()

        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_h,
            PasswordResetToken.used_at.is_(None),
        )
        result = await db.execute(stmt)
        token_record = result.scalar_one_or_none()

        if not token_record or ensure_utc(token_record.expires_at) < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token.",
            )

        token_record.used_at = now

        # Update password
        user_stmt = select(User).where(User.id == token_record.user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one()

        user.hashed_password = hash_password(new_password)

        # Security: Revoke all existing sessions on password reset
        await db.execute(
            update(RefreshSession)
            .where(RefreshSession.user_id == user.id)
            .values(is_revoked=True)
        )
        await db.commit()
