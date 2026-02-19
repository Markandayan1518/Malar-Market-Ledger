"""Market rate management API routes."""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy import select, func, and_, desc

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
from app.models.market_rate import MarketRate
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/market-rates", tags=["Market Rates"])


@router.get("/")
async def list_market_rates(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    flower_type_id: Optional[str] = Query(None),
    time_slot_id: Optional[str] = Query(None),
    effective_date: Optional[date] = Query(None),
):
    """List market rates with pagination and filtering."""
    query = select(MarketRate).where(MarketRate.deleted_at == None)
    
    if flower_type_id:
        query = query.where(MarketRate.flower_type_id == flower_type_id)
    
    if time_slot_id:
        query = query.where(MarketRate.time_slot_id == time_slot_id)
    
    if effective_date:
        query = query.where(MarketRate.effective_date == effective_date)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(desc(MarketRate.effective_date), MarketRate.flower_type_id)
    
    result = await db.execute(query)
    rates = result.scalars().all()
    
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
                "id": r.id,
                "flower_type_id": r.flower_type_id,
                "flower_type": r.flower_type.name if r.flower_type else None,
                "time_slot_id": r.time_slot_id,
                "time_slot": r.time_slot.name if r.time_slot else None,
                "rate_per_unit": float(r.rate_per_unit),
                "effective_date": r.effective_date.isoformat(),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rates
        ],
        pagination,
    )


@router.get("/current")
async def get_current_rates(
    db: DatabaseSession,
    current_user: CurrentUser,
    flower_type_id: Optional[str] = Query(None),
    time_slot_id: Optional[str] = Query(None),
    for_date: Optional[date] = Query(None, description="Date to get rates for, defaults to today"),
):
    """Get current market rates for a specific date (defaults to today)."""
    target_date = for_date or date.today()
    
    query = select(MarketRate).where(
        MarketRate.deleted_at == None,
        MarketRate.effective_date <= target_date,
    )
    
    if flower_type_id:
        query = query.where(MarketRate.flower_type_id == flower_type_id)
    
    if time_slot_id:
        query = query.where(MarketRate.time_slot_id == time_slot_id)
    
    # Get the most recent rates for each flower_type + time_slot combination
    query = query.order_by(desc(MarketRate.effective_date))
    
    result = await db.execute(query)
    rates = result.scalars().all()
    
    # Group by flower_type_id + time_slot_id and keep only the most recent
    seen = set()
    current_rates = []
    for r in rates:
        key = (r.flower_type_id, r.time_slot_id)
        if key not in seen:
            seen.add(key)
            current_rates.append(r)
    
    return create_success_response(
        [
            {
                "id": r.id,
                "flower_type_id": r.flower_type_id,
                "flower_type": r.flower_type.name if r.flower_type else None,
                "time_slot_id": r.time_slot_id,
                "time_slot": r.time_slot.name if r.time_slot else None,
                "rate_per_unit": float(r.rate_per_unit),
                "effective_date": r.effective_date.isoformat(),
            }
            for r in current_rates
        ]
    )


@router.get("/{rate_id}")
async def get_market_rate(
    rate_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get market rate by ID."""
    result = await db.execute(
        select(MarketRate)
        .where(MarketRate.id == rate_id)
        .where(MarketRate.deleted_at == None)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(status_code=404, detail="Market rate not found")
    
    return create_success_response({
        "id": rate.id,
        "flower_type_id": rate.flower_type_id,
        "flower_type": rate.flower_type.name if rate.flower_type else None,
        "time_slot_id": rate.time_slot_id,
        "time_slot": rate.time_slot.name if rate.time_slot else None,
        "rate_per_unit": float(rate.rate_per_unit),
        "effective_date": rate.effective_date.isoformat(),
        "created_at": rate.created_at.isoformat() if rate.created_at else None,
        "updated_at": rate.updated_at.isoformat() if rate.updated_at else None,
    })


@router.post("/")
async def create_market_rate(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    flower_type_id: str = Query(...),
    time_slot_id: Optional[str] = Query(None),
    rate_per_unit: Decimal = Query(..., gt=0),
    effective_date: date = Query(...),
):
    """Create a new market rate."""
    import uuid
    
    # Verify flower type exists
    flower_result = await db.execute(
        select(FlowerType).where(FlowerType.id == flower_type_id).where(FlowerType.deleted_at == None)
    )
    if not flower_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid flower_type_id")
    
    # Verify time slot exists if provided
    if time_slot_id:
        slot_result = await db.execute(
            select(TimeSlot).where(TimeSlot.id == time_slot_id).where(TimeSlot.deleted_at == None)
        )
        if not slot_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Invalid time_slot_id")
    
    rate = MarketRate(
        id=str(uuid.uuid4()),
        flower_type_id=flower_type_id,
        time_slot_id=time_slot_id,
        rate_per_unit=rate_per_unit,
        effective_date=effective_date,
    )
    db.add(rate)
    await db.commit()
    await db.refresh(rate)
    
    return create_success_response({
        "id": rate.id,
        "flower_type_id": rate.flower_type_id,
        "time_slot_id": rate.time_slot_id,
        "rate_per_unit": float(rate.rate_per_unit),
        "effective_date": rate.effective_date.isoformat(),
    }, status_code=201)


@router.post("/bulk")
async def create_market_rates_bulk(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    rates: list = Body(..., description="List of rate objects"),
):
    """Create multiple market rates at once."""
    import uuid
    
    created_rates = []
    
    for rate_data in rates:
        flower_type_id = rate_data.get("flower_type_id")
        time_slot_id = rate_data.get("time_slot_id")
        rate_per_unit = Decimal(str(rate_data.get("rate_per_unit")))
        effective_date = rate_data.get("effective_date")
        
        if isinstance(effective_date, str):
            effective_date = date.fromisoformat(effective_date)
        
        # Verify flower type exists
        flower_result = await db.execute(
            select(FlowerType).where(FlowerType.id == flower_type_id).where(FlowerType.deleted_at == None)
        )
        if not flower_result.scalar_one_or_none():
            continue  # Skip invalid entries
        
        rate = MarketRate(
            id=str(uuid.uuid4()),
            flower_type_id=flower_type_id,
            time_slot_id=time_slot_id,
            rate_per_unit=rate_per_unit,
            effective_date=effective_date,
        )
        db.add(rate)
        created_rates.append(rate)
    
    await db.commit()
    
    return create_success_response({
        "created_count": len(created_rates),
        "rates": [
            {
                "id": r.id,
                "flower_type_id": r.flower_type_id,
                "rate_per_unit": float(r.rate_per_unit),
                "effective_date": r.effective_date.isoformat(),
            }
            for r in created_rates
        ]
    }, status_code=201)


@router.put("/{rate_id}")
async def update_market_rate(
    rate_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    rate_per_unit: Optional[Decimal] = Query(None, gt=0),
    effective_date: Optional[date] = Query(None),
):
    """Update a market rate."""
    result = await db.execute(
        select(MarketRate)
        .where(MarketRate.id == rate_id)
        .where(MarketRate.deleted_at == None)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(status_code=404, detail="Market rate not found")
    
    if rate_per_unit is not None:
        rate.rate_per_unit = rate_per_unit
    if effective_date is not None:
        rate.effective_date = effective_date
    
    rate.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rate)
    
    return create_success_response({
        "id": rate.id,
        "flower_type_id": rate.flower_type_id,
        "time_slot_id": rate.time_slot_id,
        "rate_per_unit": float(rate.rate_per_unit),
        "effective_date": rate.effective_date.isoformat(),
    })


@router.delete("/{rate_id}")
async def delete_market_rate(
    rate_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Soft delete a market rate."""
    result = await db.execute(
        select(MarketRate)
        .where(MarketRate.id == rate_id)
        .where(MarketRate.deleted_at == None)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(status_code=404, detail="Market rate not found")
    
    rate.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "Market rate deleted successfully"})


@router.get("/history/{flower_type_id}")
async def get_rate_history(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
    days: int = Query(30, ge=1, le=365),
    time_slot_id: Optional[str] = Query(None),
):
    """Get rate history for a flower type."""
    start_date = date.today() - __import__("datetime").timedelta(days=days)
    
    query = select(MarketRate).where(
        MarketRate.deleted_at == None,
        MarketRate.flower_type_id == flower_type_id,
        MarketRate.effective_date >= start_date,
    )
    
    if time_slot_id:
        query = query.where(MarketRate.time_slot_id == time_slot_id)
    
    query = query.order_by(desc(MarketRate.effective_date))
    
    result = await db.execute(query)
    rates = result.scalars().all()
    
    return create_success_response(
        [
            {
                "id": r.id,
                "rate_per_unit": float(r.rate_per_unit),
                "effective_date": r.effective_date.isoformat(),
                "time_slot_id": r.time_slot_id,
                "time_slot": r.time_slot.name if r.time_slot else None,
            }
            for r in rates
        ]
    )
