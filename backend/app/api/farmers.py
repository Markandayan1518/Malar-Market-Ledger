"""Farmer management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.farmer import Farmer
from app.schemas.common import create_success_response

router = APIRouter(tags=["Farmers"])


@router.get("/")
async def list_farmers(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """List all farmers."""
    result = await db.execute(select(Farmer).where(Farmer.deleted_at == None))
    farmers = result.scalars().all()
    return {"farmers": [{"id": f.id, "name": f.name, "phone": f.phone, "village": f.village} for f in farmers]}


@router.get("/{farmer_id}")
async def get_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get farmer by ID."""
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer
