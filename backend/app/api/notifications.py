"""Notification management API routes."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, update

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.notification import Notification
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def list_notifications(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
):
    """List notifications for current user with pagination."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    
    if notification_type:
        query = query.where(Notification.notification_type == notification_type)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(Notification.created_at.desc())
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    total_pages = (total + per_page - 1) // per_page
    pagination = PaginationMeta(
        page=page,
        per_page=per_page,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
    
    return create_paginated_response(
        [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "is_read": n.is_read,
                "action_url": n.action_url,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "read_at": n.read_at.isoformat() if n.read_at else None,
            }
            for n in notifications
        ],
        pagination,
    )


@router.get("/unread-count")
async def get_unread_count(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get count of unread notifications."""
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    )
    count = result.scalar() or 0
    
    return create_success_response({"unread_count": count})


@router.get("/{notification_id}")
async def get_notification(
    notification_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get notification by ID."""
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return create_success_response({
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "action_url": notification.action_url,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "read_at": notification.read_at.isoformat() if notification.read_at else None,
    })


@router.post("/")
async def create_notification(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    user_id: str = Query(...),
    title: str = Query(..., min_length=1, max_length=200),
    message: str = Query(..., min_length=1, max_length=1000),
    notification_type: str = Query("info"),
    action_url: Optional[str] = Query(None, max_length=500),
):
    """Create a new notification (staff/admin only)."""
    import uuid
    
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=action_url,
        is_read=False,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    return create_success_response({
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "action_url": notification.action_url,
    }, status_code=201)


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Mark a notification as read."""
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "id": notification.id,
        "is_read": True,
        "read_at": notification.read_at.isoformat(),
    })


@router.put("/read-all")
async def mark_all_as_read(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Mark all notifications as read for current user."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .values(is_read=True, read_at=datetime.utcnow())
    )
    await db.commit()
    
    return create_success_response({"message": "All notifications marked as read"})


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Delete a notification."""
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.delete(notification)
    await db.commit()
    
    return create_success_response({"message": "Notification deleted successfully"})


@router.delete("/clear-all")
async def clear_all_notifications(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Delete all notifications for current user."""
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id)
    )
    notifications = result.scalars().all()
    
    for notification in notifications:
        await db.delete(notification)
    
    await db.commit()
    
    return create_success_response({
        "message": "All notifications cleared",
        "deleted_count": len(notifications),
    })


@router.delete("/clear-read")
async def clear_read_notifications(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Delete all read notifications for current user."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == True)
    )
    notifications = result.scalars().all()
    
    for notification in notifications:
        await db.delete(notification)
    
    await db.commit()
    
    return create_success_response({
        "message": "Read notifications cleared",
        "deleted_count": len(notifications),
    })
