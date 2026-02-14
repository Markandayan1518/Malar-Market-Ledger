"""Time slot management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.time_slot import TimeSlot
from app.schemas.common import create_success_response

router = APIRouter(tags=["Time Slots"])


@router.get("/")
async def list_time_slots(
    db: DatabaseSession
):
    """List all time slots."""
    result = await db.execute(select(TimeSlot).where(TimeSlot.is_active == True))
    time_slots = result.scalars().all()
    return {"time_slots": [{"id": ts.id, "name": ts.name, "start_time": str(ts.start_time), "end_time": str(ts.end_time)} for ts in time_slots]}
