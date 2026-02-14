"""Daily entry management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.daily_entry import DailyEntry
from app.schemas.common import create_success_response

router = APIRouter(tags=["Daily Entries"])


@router.get("/")
async def list_daily_entries(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    farmer_id: str = None
):
    """List daily entries."""
    query = select(DailyEntry)
    if farmer_id:
        query = query.where(DailyEntry.farmer_id == farmer_id)
    result = await db.execute(query.order_by(DailyEntry.entry_date.desc()))
    entries = result.scalars().all()
    return {"entries": [{"id": e.id, "farmer_id": e.farmer_id, "entry_date": str(e.entry_date), "quantity": e.quantity} for e in entries]}
