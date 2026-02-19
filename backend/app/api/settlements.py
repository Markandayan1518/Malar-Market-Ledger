"""Settlement management API routes."""

import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession, CurrentAdminUser
from app.models.settlement import Settlement, SettlementItem, SettlementStatus
from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.cash_advance import CashAdvance, AdvanceStatus
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta
from app.schemas.all_schemas import (
    SettlementCreateRequest,
    SettlementApproveRequest,
)

router = APIRouter(tags=["Settlements"])


# Helper to build settlement response
def build_settlement_response(settlement: Settlement, include_items: bool = False) -> dict:
    """Build a standardized settlement response."""
    response = {
        "id": settlement.id,
        "farmer_id": settlement.farmer_id,
        "farmer": {
            "id": settlement.farmer.id,
            "farmer_code": settlement.farmer.farmer_code,
            "name": settlement.farmer.name,
            "village": settlement.farmer.village,
            "phone": settlement.farmer.phone,
            "whatsapp_number": settlement.farmer.whatsapp_number,
            "address": settlement.farmer.address,
            "current_balance": float(settlement.farmer.current_balance),
            "total_advances": float(settlement.farmer.total_advances),
            "total_settlements": float(settlement.farmer.total_settlements),
            "is_active": settlement.farmer.is_active,
            "created_at": settlement.farmer.created_at,
            "updated_at": settlement.farmer.updated_at,
        } if settlement.farmer else None,
        "settlement_date": settlement.settlement_date,
        "settlement_number": settlement.settlement_number,
        "period_start": settlement.period_start,
        "period_end": settlement.period_end,
        "total_entries": settlement.total_entries,
        "total_quantity": float(settlement.total_quantity),
        "gross_amount": float(settlement.gross_amount),
        "total_commission": float(settlement.total_commission),
        "total_fees": float(settlement.total_fees),
        "total_advances": float(settlement.total_advances),
        "net_payable": float(settlement.net_payable),
        "status": settlement.status,
        "approved_by": settlement.approved_by,
        "approved_at": settlement.approved_at,
        "paid_at": settlement.paid_at,
        "notes": settlement.notes,
        "created_by": settlement.created_by,
        "created_at": settlement.created_at,
        "updated_at": settlement.updated_at,
    }
    
    if include_items and settlement.settlement_items:
        response["items"] = [
            {
                "id": item.id,
                "daily_entry_id": item.daily_entry_id,
                "entry_date": item.daily_entry.entry_date if item.daily_entry else None,
                "flower_type": item.daily_entry.flower_type.name if item.daily_entry and item.daily_entry.flower_type else None,
                "quantity": float(item.quantity),
                "rate_per_unit": float(item.rate_per_unit),
                "total_amount": float(item.total_amount),
                "commission_amount": float(item.commission_amount),
                "net_amount": float(item.net_amount),
            }
            for item in settlement.settlement_items
        ]
    
    return response


@router.get("/")
async def list_settlements(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    farmer_id: str = Query(None, description="Filter by farmer ID"),
    status: SettlementStatus = Query(None, description="Filter by status"),
    date_from: date = Query(None, description="Filter from date"),
    date_to: date = Query(None, description="Filter to date"),
):
    """
    List settlements with pagination and filtering.
    
    Returns settlements in standard response envelope format.
    """
    # Base query with soft delete filter
    query = select(Settlement).where(Settlement.deleted_at == None)
    count_query = select(func.count(Settlement.id)).where(Settlement.deleted_at == None)
    
    # Apply filters
    if farmer_id:
        query = query.where(Settlement.farmer_id == farmer_id)
        count_query = count_query.where(Settlement.farmer_id == farmer_id)
    
    if status:
        query = query.where(Settlement.status == status)
        count_query = count_query.where(Settlement.status == status)
    
    if date_from:
        query = query.where(Settlement.settlement_date >= date_from)
        count_query = count_query.where(Settlement.settlement_date >= date_from)
    
    if date_to:
        query = query.where(Settlement.settlement_date <= date_to)
        count_query = count_query.where(Settlement.settlement_date <= date_to)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.order_by(Settlement.settlement_date.desc())
    query = query.offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    settlements = result.scalars().all()
    
    # Build response
    settlement_responses = [build_settlement_response(s) for s in settlements]
    
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
    
    return create_paginated_response(settlement_responses, pagination)


@router.get("/{settlement_id}")
async def get_settlement(
    settlement_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get a single settlement by ID with items."""
    result = await db.execute(
        select(Settlement).where(
            Settlement.id == settlement_id,
            Settlement.deleted_at == None
        )
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SETTLEMENT_NOT_FOUND", "message": "Settlement not found"}
        )
    
    return create_success_response(data=build_settlement_response(settlement, include_items=True))


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_settlement(
    request: SettlementCreateRequest,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Generate a new settlement for a farmer.
    
    Creates settlement from unpaid daily entries within the specified period.
    """
    # Validate farmer exists
    farmer_result = await db.execute(
        select(Farmer).where(
            Farmer.id == request.farmer_id,
            Farmer.deleted_at == None,
            Farmer.is_active == True
        )
    )
    farmer = farmer_result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FARMER", "message": "Farmer not found or inactive"}
        )
    
    # Check for overlapping settlements
    overlapping = await db.execute(
        select(Settlement).where(
            Settlement.farmer_id == request.farmer_id,
            Settlement.deleted_at == None,
            Settlement.status.in_([SettlementStatus.DRAFT, SettlementStatus.PENDING_APPROVAL]),
            or_(
                and_(
                    Settlement.period_start <= request.period_start,
                    Settlement.period_end >= request.period_start
                ),
                and_(
                    Settlement.period_start <= request.period_end,
                    Settlement.period_end >= request.period_end
                ),
            )
        )
    )
    if overlapping.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OVERLAPPING_PERIOD", "message": "A settlement already exists for this period"}
        )
    
    # Get unpaid entries in period
    entries_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.farmer_id == request.farmer_id,
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= request.period_start,
            DailyEntry.entry_date <= request.period_end,
            # Entries not already in a settlement
            ~DailyEntry.id.in_(
                select(SettlementItem.daily_entry_id).join(Settlement).where(
                    Settlement.deleted_at == None,
                    Settlement.status.in_([SettlementStatus.APPROVED, SettlementStatus.PAID])
                )
            )
        ).order_by(DailyEntry.entry_date)
    )
    entries = entries_result.scalars().all()
    
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_ENTRIES", "message": "No unpaid entries found in the specified period"}
        )
    
    # Calculate totals
    total_quantity = sum(float(e.quantity) for e in entries)
    gross_amount = sum(float(e.total_amount) for e in entries)
    total_commission = sum(float(e.commission_amount) for e in entries)
    net_from_entries = sum(float(e.net_amount) for e in entries)
    
    # Get approved advances in period
    advances_result = await db.execute(
        select(func.sum(CashAdvance.amount)).where(
            CashAdvance.farmer_id == request.farmer_id,
            CashAdvance.deleted_at == None,
            CashAdvance.status == AdvanceStatus.APPROVED,
            CashAdvance.advance_date >= request.period_start,
            CashAdvance.advance_date <= request.period_end
        )
    )
    total_advances = float(advances_result.scalar() or 0)
    
    # Calculate net payable
    net_payable = net_from_entries - total_advances
    
    # Generate settlement number
    today = date.today()
    count_result = await db.execute(
        select(func.count(Settlement.id)).where(
            Settlement.settlement_date >= today.replace(day=1),
            Settlement.settlement_date < today.replace(day=1).replace(month=today.month % 12 + 1) if today.month < 12 else today.replace(year=today.year + 1, month=1)
        )
    )
    month_count = count_result.scalar() or 0
    settlement_number = f"SET-{today.strftime('%Y%m')}-{month_count + 1:04d}"
    
    # Create settlement
    settlement = Settlement(
        id=str(uuid.uuid4()),
        farmer_id=request.farmer_id,
        settlement_date=date.today(),
        settlement_number=settlement_number,
        period_start=request.period_start,
        period_end=request.period_end,
        total_entries=len(entries),
        total_quantity=total_quantity,
        gross_amount=gross_amount,
        total_commission=total_commission,
        total_fees=0.00,
        total_advances=total_advances,
        net_payable=net_payable,
        status=SettlementStatus.DRAFT,
        notes=request.notes,
        created_by=current_user.id,
    )
    
    db.add(settlement)
    await db.flush()  # Get settlement ID
    
    # Create settlement items
    for entry in entries:
        item = SettlementItem(
            id=str(uuid.uuid4()),
            settlement_id=settlement.id,
            daily_entry_id=entry.id,
            quantity=entry.quantity,
            rate_per_unit=entry.rate_per_unit,
            total_amount=entry.total_amount,
            commission_amount=entry.commission_amount,
            net_amount=entry.net_amount,
        )
        db.add(item)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Settlement).where(Settlement.id == settlement.id)
    )
    settlement = result.scalar_one()
    
    return create_success_response(
        data=build_settlement_response(settlement, include_items=True),
        message="Settlement generated successfully"
    )


@router.put("/{settlement_id}/approve")
async def approve_settlement(
    settlement_id: str,
    request: SettlementApproveRequest,
    db: DatabaseSession,
    current_user: CurrentAdminUser  # Only admin can approve
):
    """
    Approve a settlement.
    
    Changes status from DRAFT/PENDING_APPROVAL to APPROVED.
    Only admins can approve settlements.
    """
    result = await db.execute(
        select(Settlement).where(
            Settlement.id == settlement_id,
            Settlement.deleted_at == None
        )
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SETTLEMENT_NOT_FOUND", "message": "Settlement not found"}
        )
    
    if settlement.status not in [SettlementStatus.DRAFT, SettlementStatus.PENDING_APPROVAL]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATUS", "message": "Settlement cannot be approved in current status"}
        )
    
    # Update status
    settlement.status = SettlementStatus.APPROVED
    settlement.approved_by = current_user.id
    settlement.approved_at = datetime.utcnow()
    if request.notes:
        settlement.notes = request.notes
    settlement.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Settlement).where(Settlement.id == settlement.id)
    )
    settlement = result.scalar_one()
    
    return create_success_response(
        data=build_settlement_response(settlement),
        message="Settlement approved successfully"
    )


@router.put("/{settlement_id}/pay")
async def mark_settlement_paid(
    settlement_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser  # Only admin can mark as paid
):
    """
    Mark a settlement as paid.
    
    Changes status from APPROVED to PAID and updates farmer balance.
    Only admins can mark settlements as paid.
    """
    result = await db.execute(
        select(Settlement).where(
            Settlement.id == settlement_id,
            Settlement.deleted_at == None
        )
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SETTLEMENT_NOT_FOUND", "message": "Settlement not found"}
        )
    
    if settlement.status != SettlementStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATUS", "message": "Settlement must be approved before marking as paid"}
        )
    
    # Update settlement status
    settlement.status = SettlementStatus.PAID
    settlement.paid_at = datetime.utcnow()
    settlement.updated_at = datetime.utcnow()
    
    # Update farmer balance
    farmer_result = await db.execute(
        select(Farmer).where(Farmer.id == settlement.farmer_id)
    )
    farmer = farmer_result.scalar_one()
    farmer.current_balance = float(farmer.current_balance) + float(settlement.net_payable)
    farmer.total_settlements = float(farmer.total_settlements) + float(settlement.net_payable)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Settlement).where(Settlement.id == settlement.id)
    )
    settlement = result.scalar_one()
    
    return create_success_response(
        data=build_settlement_response(settlement),
        message="Settlement marked as paid successfully"
    )


@router.delete("/{settlement_id}")
async def delete_settlement(
    settlement_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Soft delete a settlement.
    
    Only DRAFT settlements can be deleted.
    """
    result = await db.execute(
        select(Settlement).where(
            Settlement.id == settlement_id,
            Settlement.deleted_at == None
        )
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SETTLEMENT_NOT_FOUND", "message": "Settlement not found"}
        )
    
    if settlement.status != SettlementStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE", "message": "Only draft settlements can be deleted"}
        )
    
    # Soft delete
    settlement.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": settlement_id, "deleted": True},
        message="Settlement deleted successfully"
    )


# Import or_ for the overlapping check
from sqlalchemy import or_
