"""Market rate management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.market_rate import MarketRate
from app.schemas.common import create_success_response

router = APIRouter(tags=["Market Rates"])


@router.get("/")
async def list_market_rates(
    db: DatabaseSession,
    flower_type_id: str = None
):
    """List market rates."""
    query = select(MarketRate)
    if flower_type_id:
        query = query.where(MarketRate.flower_type_id == flower_type_id)
    result = await db.execute(query)
    rates = result.scalars().all()
    return {"rates": [{"id": r.id, "flower_type_id": r.flower_type_id, "rate_per_unit": r.rate_per_unit, "effective_date": str(r.effective_date)} for r in rates]}
