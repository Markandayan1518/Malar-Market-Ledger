"""Notification management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, DatabaseSession
from app.models.notification import Notification
from app.schemas.common import create_success_response

router = APIRouter(tags=["Notifications"])


@router.get("/")
async def list_notifications(
    db: DatabaseSession,
    current_user: CurrentUser
):
    """List notifications for current user."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return {"notifications": [{"id": n.id, "title": n.title, "message": n.message, "is_read": n.is_read} for n in notifications]}
