"""Cash advance management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.cash_advance import CashAdvance
from app.schemas.common import create_success_response

router = APIRouter(tags=["Cash Advances"])


@router.get("/")
async def list_cash_advances(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    farmer_id: str = None
):
    """List cash advances."""
    query = select(CashAdvance)
    if farmer_id:
        query = query.where(CashAdvance.farmer_id == farmer_id)
    result = await db.execute(query.order_by(CashAdvance.advance_date.desc()))
    advances = result.scalars().all()
    return {"advances": [{"id": a.id, "farmer_id": a.farmer_id, "amount": a.amount, "advance_date": str(a.advance_date)} for a in advances]}
