from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.schemas.pin import (
    PinCreate,
    PinResponse,
    PinListResponse,
)
from app.services.pin_service import PinService

router = APIRouter(prefix="", tags=["Pinned Messages"])


@router.post("", response_model=PinResponse, status_code=status.HTTP_201_CREATED)
async def pin_message(
    payload: PinCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pin a message within a conversation."""
    pin = await PinService.pin_message(
        db=db,
        user_id=current_user.id,
        conversation_id=payload.conversation_id,
        message_id=payload.message_id,
        note=payload.note,
    )
    return pin


@router.get("", response_model=PinListResponse)
async def list_pins(
    conversation_id: Optional[UUID] = Query(None, description="Filter pins by conversation ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pinned messages for current user, optionally filtered by conversation."""
    pins = await PinService.get_user_pins(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        limit=limit,
        offset=offset,
    )
    return PinListResponse(pins=pins)


@router.get("/{pin_id}", response_model=PinResponse)
async def get_pin(
    pin_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific pinned message."""
    pin = await PinService.get_pin(
        db=db,
        user_id=current_user.id,
        pin_id=pin_id,
    )
    if not pin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pin not found",
        )
    return pin


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unpin_by_id(
    pin_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unpin a message by its pin ID."""
    await PinService.unpin_message(
        db=db,
        user_id=current_user.id,
        pin_id=pin_id,
    )
    return None


@router.delete("/message/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unpin_by_message_id(
    message_id: UUID,
    conversation_id: Optional[UUID] = Query(None, description="Optional conversation ID filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unpin a message directly by its message ID."""
    await PinService.unpin_by_message_id(
        db=db,
        user_id=current_user.id,
        message_id=message_id,
        conversation_id=conversation_id,
    )
    return None
