"""Daily entry management API routes."""

import uuid
from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.market_rate import MarketRate
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta
from app.schemas.all_schemas import (
    DailyEntryCreate,
    DailyEntryUpdate,
    DailyEntryResponse,
    FarmerResponse,
    FlowerTypeResponse,
    TimeSlotResponse,
)

router = APIRouter(tags=["Daily Entries"])


# Helper function to calculate entry amounts
def calculate_entry_amounts(quantity: float, rate_per_unit: float, commission_rate: float = 5.0):
    """Calculate total, commission, and net amounts for an entry."""
    total_amount = round(quantity * rate_per_unit, 2)
    commission_amount = round(total_amount * (commission_rate / 100), 2)
    net_amount = round(total_amount - commission_amount, 2)
    return total_amount, commission_amount, net_amount


# Helper to get current rate
async def get_current_rate_for_entry(
    db: DatabaseSession,
    flower_type_id: str,
    time_slot_id: str,
    entry_date: date
) -> tuple[float, float]:
    """Get rate and commission rate for entry. Returns (rate_per_unit, commission_rate)."""
    # Try to get specific market rate
    rate_result = await db.execute(
        select(MarketRate).where(
            MarketRate.flower_type_id == flower_type_id,
            MarketRate.time_slot_id == time_slot_id,
            MarketRate.effective_date <= entry_date,
            MarketRate.is_active == True,
            MarketRate.deleted_at == None,
        ).order_by(MarketRate.effective_date.desc())
    )
    market_rate = rate_result.scalar_one_or_none()
    
    if market_rate:
        return float(market_rate.rate_per_unit), 5.0  # Default commission 5%
    
    # Fallback to default rate
    return 100.0, 5.0  # Default rate 100, commission 5%


# Helper to build response
def build_entry_response(entry: DailyEntry) -> dict:
    """Build a standardized entry response."""
    return {
        "id": entry.id,
        "farmer_id": entry.farmer_id,
        "farmer": {
            "id": entry.farmer.id,
            "farmer_code": entry.farmer.farmer_code,
            "name": entry.farmer.name,
            "village": entry.farmer.village,
            "phone": entry.farmer.phone,
            "whatsapp_number": entry.farmer.whatsapp_number,
            "address": entry.farmer.address,
            "current_balance": float(entry.farmer.current_balance),
            "total_advances": float(entry.farmer.total_advances),
            "total_settlements": float(entry.farmer.total_settlements),
            "is_active": entry.farmer.is_active,
            "created_at": entry.farmer.created_at,
            "updated_at": entry.farmer.updated_at,
        } if entry.farmer else None,
        "flower_type_id": entry.flower_type_id,
        "flower_type": {
            "id": entry.flower_type.id,
            "name": entry.flower_type.name,
            "name_ta": entry.flower_type.name_ta,
            "code": entry.flower_type.code,
            "description": entry.flower_type.description,
            "unit": entry.flower_type.unit,
            "is_active": entry.flower_type.is_active,
            "created_at": entry.flower_type.created_at,
            "updated_at": entry.flower_type.updated_at,
        } if entry.flower_type else None,
        "time_slot_id": entry.time_slot_id,
        "time_slot": {
            "id": entry.time_slot.id,
            "name": entry.time_slot.name,
            "name_ta": entry.time_slot.name_ta,
            "start_time": entry.time_slot.start_time,
            "end_time": entry.time_slot.end_time,
            "is_active": entry.time_slot.is_active,
            "created_at": entry.time_slot.created_at,
            "updated_at": entry.time_slot.updated_at,
        } if entry.time_slot else None,
        "entry_date": entry.entry_date,
        "entry_time": entry.entry_time,
        "quantity": float(entry.quantity),
        "rate_per_unit": float(entry.rate_per_unit),
        "total_amount": float(entry.total_amount),
        "commission_rate": float(entry.commission_rate),
        "commission_amount": float(entry.commission_amount),
        "net_amount": float(entry.net_amount),
        "notes": entry.notes,
        "created_by": entry.created_by,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


@router.get("/")
async def list_daily_entries(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    farmer_id: str = Query(None, description="Filter by farmer ID"),
    flower_type_id: str = Query(None, description="Filter by flower type ID"),
    entry_date: date = Query(None, description="Filter by specific date"),
    date_from: date = Query(None, description="Filter from date (inclusive)"),
    date_to: date = Query(None, description="Filter to date (inclusive)"),
):
    """
    List daily entries with pagination and filtering.
    
    Returns entries in standard response envelope format.
    """
    # Base query with soft delete filter and relationships
    query = select(DailyEntry).where(DailyEntry.deleted_at == None).options(
        # Relationships will be loaded automatically
    )
    count_query = select(func.count(DailyEntry.id)).where(DailyEntry.deleted_at == None)
    
    # Apply filters
    if farmer_id:
        query = query.where(DailyEntry.farmer_id == farmer_id)
        count_query = count_query.where(DailyEntry.farmer_id == farmer_id)
    
    if flower_type_id:
        query = query.where(DailyEntry.flower_type_id == flower_type_id)
        count_query = count_query.where(DailyEntry.flower_type_id == flower_type_id)
    
    if entry_date:
        query = query.where(DailyEntry.entry_date == entry_date)
        count_query = count_query.where(DailyEntry.entry_date == entry_date)
    
    if date_from:
        query = query.where(DailyEntry.entry_date >= date_from)
        count_query = count_query.where(DailyEntry.entry_date >= date_from)
    
    if date_to:
        query = query.where(DailyEntry.entry_date <= date_to)
        count_query = count_query.where(DailyEntry.entry_date <= date_to)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.order_by(DailyEntry.entry_date.desc(), DailyEntry.entry_time.desc())
    query = query.offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    entries = result.scalars().all()
    
    # Build response
    entry_responses = [build_entry_response(e) for e in entries]
    
    # Calculate pagination metadata
    total_pages = (total + per_page - 1) // per_page
    pagination = PaginationMeta(
        page=page,
        per_page=per_page,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
    
    return create_paginated_response(entry_responses, pagination)


@router.get("/summary")
async def get_daily_summary(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    entry_date: date = Query(..., description="Date for summary"),
):
    """
    Get daily summary statistics.
    
    Returns aggregated statistics for a specific date.
    """
    # Base filter
    base_filter = and_(
        DailyEntry.deleted_at == None,
        DailyEntry.entry_date == entry_date
    )
    
    # Get total entries count
    count_result = await db.execute(
        select(func.count(DailyEntry.id)).where(base_filter)
    )
    total_entries = count_result.scalar() or 0
    
    # Get aggregated amounts
    agg_result = await db.execute(
        select(
            func.sum(DailyEntry.quantity).label("total_quantity"),
            func.sum(DailyEntry.total_amount).label("gross_amount"),
            func.sum(DailyEntry.commission_amount).label("total_commission"),
            func.sum(DailyEntry.net_amount).label("net_amount"),
            func.count(func.distinct(DailyEntry.farmer_id)).label("unique_farmers"),
        ).where(base_filter)
    )
    agg = agg_result.one()
    
    # Get breakdown by flower type
    breakdown_result = await db.execute(
        select(
            FlowerType.name,
            FlowerType.id,
            func.count(DailyEntry.id).label("entry_count"),
            func.sum(DailyEntry.quantity).label("quantity"),
            func.sum(DailyEntry.total_amount).label("amount"),
        ).join(FlowerType, DailyEntry.flower_type_id == FlowerType.id)
        .where(base_filter)
        .group_by(FlowerType.id, FlowerType.name)
    )
    breakdown = breakdown_result.all()
    
    return create_success_response(
        data={
            "date": entry_date,
            "total_entries": total_entries,
            "total_quantity": float(agg.total_quantity or 0),
            "gross_amount": float(agg.gross_amount or 0),
            "total_commission": float(agg.total_commission or 0),
            "net_amount": float(agg.net_amount or 0),
            "unique_farmers": agg.unique_farmers or 0,
            "flower_type_breakdown": [
                {
                    "flower_type_id": b.id,
                    "flower_type": b.name,
                    "entry_count": b.entry_count,
                    "quantity": float(b.quantity or 0),
                    "amount": float(b.amount or 0),
                }
                for b in breakdown
            ]
        }
    )


@router.get("/{entry_id}")
async def get_daily_entry(
    entry_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get a single daily entry by ID."""
    result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == entry_id,
            DailyEntry.deleted_at == None
        )
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ENTRY_NOT_FOUND", "message": "Daily entry not found"}
        )
    
    return create_success_response(data=build_entry_response(entry))


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_daily_entry(
    entry_data: DailyEntryCreate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Create a new daily entry with auto-calculations.
    
    Automatically calculates total_amount, commission_amount, and net_amount
    based on quantity and current market rate.
    """
    # Validate farmer exists
    farmer_result = await db.execute(
        select(Farmer).where(
            Farmer.id == entry_data.farmer_id,
            Farmer.deleted_at == None,
            Farmer.is_active == True
        )
    )
    if not farmer_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FARMER", "message": "Farmer not found or inactive"}
        )
    
    # Validate flower type exists
    flower_result = await db.execute(
        select(FlowerType).where(
            FlowerType.id == entry_data.flower_type_id,
            FlowerType.deleted_at == None,
            FlowerType.is_active == True
        )
    )
    flower_type = flower_result.scalar_one_or_none()
    if not flower_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FLOWER_TYPE", "message": "Flower type not found or inactive"}
        )
    
    # Get current time slot (or use default)
    current_time = entry_data.entry_time if entry_data.entry_time else datetime.utcnow().time()
    
    # Find active time slot
    time_slot_result = await db.execute(
        select(TimeSlot).where(
            TimeSlot.deleted_at == None,
            TimeSlot.is_active == True
        ).order_by(TimeSlot.start_time)
    )
    time_slots = time_slot_result.scalars().all()
    
    # Default to first time slot if none specified
    time_slot_id = None
    if time_slots:
        # Find matching time slot
        for ts in time_slots:
            if ts.start_time <= current_time <= ts.end_time:
                time_slot_id = ts.id
                break
        if not time_slot_id:
            time_slot_id = time_slots[0].id  # Default to first
    
    if not time_slot_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_TIME_SLOT", "message": "No active time slot found"}
        )
    
    # Get rate for this flower type and time slot
    rate_per_unit, commission_rate = await get_current_rate_for_entry(
        db, entry_data.flower_type_id, time_slot_id, entry_data.entry_date
    )
    
    # Calculate amounts
    total_amount, commission_amount, net_amount = calculate_entry_amounts(
        entry_data.quantity, rate_per_unit, commission_rate
    )
    
    # Create entry
    entry = DailyEntry(
        id=str(uuid.uuid4()),
        farmer_id=entry_data.farmer_id,
        flower_type_id=entry_data.flower_type_id,
        time_slot_id=time_slot_id,
        entry_date=entry_data.entry_date,
        entry_time=entry_data.entry_time if entry_data.entry_time else current_time,
        quantity=entry_data.quantity,
        rate_per_unit=rate_per_unit,
        total_amount=total_amount,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        net_amount=net_amount,
        notes=entry_data.notes,
        created_by=current_user.id,
    )
    
    db.add(entry)
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry.id)
    )
    entry = result.scalar_one()
    
    return create_success_response(
        data=build_entry_response(entry),
        message="Daily entry created successfully"
    )


class BulkEntryItem(BaseModel):
    """Schema for bulk entry creation item."""
    farmer_id: str
    flower_type_id: str
    entry_date: date
    entry_time: Optional[time] = None
    quantity: float
    notes: Optional[str] = None


class BulkEntryRequest(BaseModel):
    """Schema for bulk entry creation request."""
    entries: List[BulkEntryItem]


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def create_bulk_entries(
    bulk_data: BulkEntryRequest,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Create multiple daily entries in bulk.
    
    Useful for offline sync and batch data entry.
    """
    if not bulk_data.entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_REQUEST", "message": "No entries provided"}
        )
    
    created_entries = []
    errors = []
    
    # Get default time slot
    time_slot_result = await db.execute(
        select(TimeSlot).where(
            TimeSlot.deleted_at == None,
            TimeSlot.is_active == True
        ).order_by(TimeSlot.start_time).limit(1)
    )
    default_time_slot = time_slot_result.scalar_one_or_none()
    
    for idx, item in enumerate(bulk_data.entries):
        try:
            # Validate farmer
            farmer_result = await db.execute(
                select(Farmer).where(
                    Farmer.id == item.farmer_id,
                    Farmer.deleted_at == None
                )
            )
            if not farmer_result.scalar_one_or_none():
                errors.append({"index": idx, "error": "Farmer not found"})
                continue
            
            # Validate flower type
            flower_result = await db.execute(
                select(FlowerType).where(
                    FlowerType.id == item.flower_type_id,
                    FlowerType.deleted_at == None
                )
            )
            flower_type = flower_result.scalar_one_or_none()
            if not flower_type:
                errors.append({"index": idx, "error": "Flower type not found"})
                continue
            
            # Get time slot
            time_slot_id = default_time_slot.id if default_time_slot else None
            if not time_slot_id:
                errors.append({"index": idx, "error": "No time slot available"})
                continue
            
            # Get rate
            rate_per_unit, commission_rate = await get_current_rate_for_entry(
                db, item.flower_type_id, time_slot_id, item.entry_date
            )
            
            # Calculate amounts
            total_amount, commission_amount, net_amount = calculate_entry_amounts(
                item.quantity, rate_per_unit, commission_rate
            )
            
            # Create entry
            entry = DailyEntry(
                id=str(uuid.uuid4()),
                farmer_id=item.farmer_id,
                flower_type_id=item.flower_type_id,
                time_slot_id=time_slot_id,
                entry_date=item.entry_date,
                entry_time=item.entry_time if item.entry_time else datetime.utcnow().time(),
                quantity=item.quantity,
                rate_per_unit=rate_per_unit,
                total_amount=total_amount,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                net_amount=net_amount,
                notes=item.notes,
                created_by=current_user.id,
            )
            
            db.add(entry)
            created_entries.append(entry.id)
            
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})
    
    await db.commit()
    
    return create_success_response(
        data={
            "created_count": len(created_entries),
            "created_ids": created_entries,
            "error_count": len(errors),
            "errors": errors if errors else None,
        },
        message=f"Created {len(created_entries)} entries"
    )


@router.put("/{entry_id}")
async def update_daily_entry(
    entry_id: str,
    entry_data: DailyEntryUpdate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Update a daily entry."""
    result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == entry_id,
            DailyEntry.deleted_at == None
        )
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ENTRY_NOT_FOUND", "message": "Daily entry not found"}
        )
    
    # Update fields
    update_data = entry_data.model_dump(exclude_unset=True)
    
    # If quantity changed, recalculate amounts
    if "quantity" in update_data:
        new_quantity = update_data["quantity"]
        total_amount, commission_amount, net_amount = calculate_entry_amounts(
            new_quantity, float(entry.rate_per_unit), float(entry.commission_rate)
        )
        entry.quantity = new_quantity
        entry.total_amount = total_amount
        entry.commission_amount = commission_amount
        entry.net_amount = net_amount
    
    if "entry_time" in update_data:
        entry.entry_time = update_data["entry_time"]
    
    if "notes" in update_data:
        entry.notes = update_data["notes"]
    
    entry.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry.id)
    )
    entry = result.scalar_one()
    
    return create_success_response(
        data=build_entry_response(entry),
        message="Daily entry updated successfully"
    )


@router.delete("/{entry_id}")
async def delete_daily_entry(
    entry_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Soft delete a daily entry.
    
    Sets deleted_at timestamp instead of hard delete.
    """
    result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == entry_id,
            DailyEntry.deleted_at == None
        )
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ENTRY_NOT_FOUND", "message": "Daily entry not found"}
        )
    
    # Soft delete
    entry.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": entry_id, "deleted": True},
        message="Daily entry deleted successfully"
    )
