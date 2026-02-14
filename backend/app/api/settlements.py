"""Settlement management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.settlement import Settlement
from app.schemas.common import create_success_response

router = APIRouter(tags=["Settlements"])


@router.get("/")
async def list_settlements(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    farmer_id: str = None
):
    """List settlements."""
    query = select(Settlement)
    if farmer_id:
        query = query.where(Settlement.farmer_id == farmer_id)
    result = await db.execute(query.order_by(Settlement.settlement_date.desc()))
    settlements = result.scalars().all()
    return {"settlements": [{"id": s.id, "farmer_id": s.farmer_id, "amount": s.amount, "settlement_date": str(s.settlement_date)} for s in settlements]}
