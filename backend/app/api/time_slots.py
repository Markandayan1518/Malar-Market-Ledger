"""Time slot management API routes."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
from app.models.time_slot import TimeSlot
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/time-slots", tags=["Time Slots"])


@router.get("/")
async def list_time_slots(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """List all time slots with pagination."""
    query = select(TimeSlot).where(TimeSlot.deleted_at == None)
    
    if search:
        query = query.where(TimeSlot.name.ilike(f"%{search}%"))
    
    if is_active is not None:
        query = query.where(TimeSlot.is_active == is_active)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(TimeSlot.start_time)
    
    result = await db.execute(query)
    time_slots = result.scalars().all()
    
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
                "id": ts.id,
                "name": ts.name,
                "name_ta": ts.name_ta,
                "start_time": str(ts.start_time),
                "end_time": str(ts.end_time),
                "is_active": ts.is_active,
                "created_at": ts.created_at.isoformat() if ts.created_at else None,
            }
            for ts in time_slots
        ],
        pagination,
    )


@router.get("/active")
async def list_active_time_slots(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """List all active time slots for dropdowns."""
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.deleted_at == None)
        .where(TimeSlot.is_active == True)
        .order_by(TimeSlot.start_time)
    )
    time_slots = result.scalars().all()
    
    return create_success_response(
        [
            {
                "id": ts.id,
                "name": ts.name,
                "name_ta": ts.name_ta,
                "start_time": str(ts.start_time),
                "end_time": str(ts.end_time),
            }
            for ts in time_slots
        ]
    )


@router.get("/{time_slot_id}")
async def get_time_slot(
    time_slot_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get time slot by ID."""
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.id == time_slot_id)
        .where(TimeSlot.deleted_at == None)
    )
    time_slot = result.scalar_one_or_none()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    return create_success_response({
        "id": time_slot.id,
        "name": time_slot.name,
        "name_ta": time_slot.name_ta,
        "start_time": str(time_slot.start_time),
        "end_time": str(time_slot.end_time),
        "is_active": time_slot.is_active,
        "created_at": time_slot.created_at.isoformat() if time_slot.created_at else None,
        "updated_at": time_slot.updated_at.isoformat() if time_slot.updated_at else None,
    })


@router.post("/")
async def create_time_slot(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    name: str = Query(..., min_length=1, max_length=100),
    name_ta: str = Query(..., min_length=1, max_length=100, description="Tamil name"),
    start_time: str = Query(..., description="Start time in HH:MM format"),
    end_time: str = Query(..., description="End time in HH:MM format"),
):
    """Create a new time slot."""
    import uuid
    from datetime import time
    
    try:
        start_parts = list(map(int, start_time.split(":")))
        end_parts = list(map(int, end_time.split(":")))
        start_time_obj = time(start_parts[0], start_parts[1])
        end_time_obj = time(end_parts[0], end_parts[1])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM format.")
    
    time_slot = TimeSlot(
        id=str(uuid.uuid4()),
        name=name,
        name_ta=name_ta,
        start_time=start_time_obj,
        end_time=end_time_obj,
        is_active=True,
    )
    db.add(time_slot)
    await db.commit()
    await db.refresh(time_slot)
    
    return create_success_response({
        "id": time_slot.id,
        "name": time_slot.name,
        "name_ta": time_slot.name_ta,
        "start_time": str(time_slot.start_time),
        "end_time": str(time_slot.end_time),
        "is_active": time_slot.is_active,
    }, status_code=201)


@router.put("/{time_slot_id}")
async def update_time_slot(
    time_slot_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    name: Optional[str] = Query(None, min_length=1, max_length=100),
    name_ta: Optional[str] = Query(None, min_length=1, max_length=100),
    start_time: Optional[str] = Query(None, description="Start time in HH:MM format"),
    end_time: Optional[str] = Query(None, description="End time in HH:MM format"),
):
    """Update a time slot."""
    from datetime import time
    
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.id == time_slot_id)
        .where(TimeSlot.deleted_at == None)
    )
    time_slot = result.scalar_one_or_none()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    if name is not None:
        time_slot.name = name
    if name_ta is not None:
        time_slot.name_ta = name_ta
    if start_time is not None:
        try:
            start_parts = list(map(int, start_time.split(":")))
            time_slot.start_time = time(start_parts[0], start_parts[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid start_time format. Use HH:MM format.")
    if end_time is not None:
        try:
            end_parts = list(map(int, end_time.split(":")))
            time_slot.end_time = time(end_parts[0], end_parts[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid end_time format. Use HH:MM format.")
    
    time_slot.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(time_slot)
    
    return create_success_response({
        "id": time_slot.id,
        "name": time_slot.name,
        "name_ta": time_slot.name_ta,
        "start_time": str(time_slot.start_time),
        "end_time": str(time_slot.end_time),
        "is_active": time_slot.is_active,
    })


@router.delete("/{time_slot_id}")
async def delete_time_slot(
    time_slot_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Soft delete a time slot."""
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.id == time_slot_id)
        .where(TimeSlot.deleted_at == None)
    )
    time_slot = result.scalar_one_or_none()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    time_slot.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "Time slot deleted successfully"})


@router.patch("/{time_slot_id}/deactivate")
async def deactivate_time_slot(
    time_slot_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
):
    """Deactivate a time slot."""
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.id == time_slot_id)
        .where(TimeSlot.deleted_at == None)
    )
    time_slot = result.scalar_one_or_none()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    time_slot.is_active = False
    time_slot.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "id": time_slot.id,
        "is_active": False,
    })


@router.patch("/{time_slot_id}/activate")
async def activate_time_slot(
    time_slot_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
):
    """Activate a time slot."""
    result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.id == time_slot_id)
        .where(TimeSlot.deleted_at == None)
    )
    time_slot = result.scalar_one_or_none()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    time_slot.is_active = True
    time_slot.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "id": time_slot.id,
        "is_active": True,
    })
