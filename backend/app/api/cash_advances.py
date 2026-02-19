"""Cash advance management API routes."""

import uuid
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession, CurrentAdminUser
from app.models.cash_advance import CashAdvance, AdvanceStatus
from app.models.farmer import Farmer
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta
from app.schemas.all_schemas import (
    CashAdvanceCreate,
    CashAdvanceUpdate,
    CashAdvanceApproveRequest,
)

router = APIRouter(tags=["Cash Advances"])


# Helper to build advance response
def build_advance_response(advance: CashAdvance) -> dict:
    """Build a standardized cash advance response."""
    return {
        "id": advance.id,
        "farmer_id": advance.farmer_id,
        "farmer": {
            "id": advance.farmer.id,
            "farmer_code": advance.farmer.farmer_code,
            "name": advance.farmer.name,
            "village": advance.farmer.village,
            "phone": advance.farmer.phone,
            "whatsapp_number": advance.farmer.whatsapp_number,
            "address": advance.farmer.address,
            "current_balance": float(advance.farmer.current_balance),
            "total_advances": float(advance.farmer.total_advances),
            "total_settlements": float(advance.farmer.total_settlements),
            "is_active": advance.farmer.is_active,
            "created_at": advance.farmer.created_at,
            "updated_at": advance.farmer.updated_at,
        } if advance.farmer else None,
        "amount": float(advance.amount),
        "reason": advance.reason,
        "advance_date": advance.advance_date,
        "status": advance.status,
        "approved_by": advance.approved_by,
        "approved_at": advance.approved_at,
        "notes": advance.notes,
        "created_by": advance.created_by,
        "created_at": advance.created_at,
        "updated_at": advance.updated_at,
    }


@router.get("/")
async def list_cash_advances(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    farmer_id: str = Query(None, description="Filter by farmer ID"),
    status: AdvanceStatus = Query(None, description="Filter by status"),
    date_from: date = Query(None, description="Filter from date"),
    date_to: date = Query(None, description="Filter to date"),
):
    """
    List cash advances with pagination and filtering.
    
    Returns advances in standard response envelope format.
    """
    # Base query with soft delete filter
    query = select(CashAdvance).where(CashAdvance.deleted_at == None)
    count_query = select(func.count(CashAdvance.id)).where(CashAdvance.deleted_at == None)
    
    # Apply filters
    if farmer_id:
        query = query.where(CashAdvance.farmer_id == farmer_id)
        count_query = count_query.where(CashAdvance.farmer_id == farmer_id)
    
    if status:
        query = query.where(CashAdvance.status == status)
        count_query = count_query.where(CashAdvance.status == status)
    
    if date_from:
        query = query.where(CashAdvance.advance_date >= date_from)
        count_query = count_query.where(CashAdvance.advance_date >= date_from)
    
    if date_to:
        query = query.where(CashAdvance.advance_date <= date_to)
        count_query = count_query.where(CashAdvance.advance_date <= date_to)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.order_by(CashAdvance.advance_date.desc())
    query = query.offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    advances = result.scalars().all()
    
    # Build response
    advance_responses = [build_advance_response(a) for a in advances]
    
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
    
    return create_paginated_response(advance_responses, pagination)


@router.get("/{advance_id}")
async def get_cash_advance(
    advance_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get a single cash advance by ID."""
    result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.id == advance_id,
            CashAdvance.deleted_at == None
        )
    )
    advance = result.scalar_one_or_none()
    
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADVANCE_NOT_FOUND", "message": "Cash advance not found"}
        )
    
    return create_success_response(data=build_advance_response(advance))


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_cash_advance(
    advance_data: CashAdvanceCreate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Create a new cash advance request.
    
    Creates advance with PENDING status for approval workflow.
    """
    # Validate farmer exists
    farmer_result = await db.execute(
        select(Farmer).where(
            Farmer.id == advance_data.farmer_id,
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
    
    # Create advance
    advance = CashAdvance(
        id=str(uuid.uuid4()),
        farmer_id=advance_data.farmer_id,
        amount=advance_data.amount,
        reason=advance_data.reason,
        advance_date=advance_data.advance_date,
        status=AdvanceStatus.PENDING,
        notes=advance_data.notes,
        created_by=current_user.id,
    )
    
    db.add(advance)
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(CashAdvance).where(CashAdvance.id == advance.id)
    )
    advance = result.scalar_one()
    
    return create_success_response(
        data=build_advance_response(advance),
        message="Cash advance request created successfully"
    )


@router.put("/{advance_id}")
async def update_cash_advance(
    advance_id: str,
    advance_data: CashAdvanceUpdate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Update a cash advance (only notes can be updated)."""
    result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.id == advance_id,
            CashAdvance.deleted_at == None
        )
    )
    advance = result.scalar_one_or_none()
    
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADVANCE_NOT_FOUND", "message": "Cash advance not found"}
        )
    
    if advance.status != AdvanceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_UPDATE", "message": "Only pending advances can be updated"}
        )
    
    # Update notes only
    if advance_data.notes is not None:
        advance.notes = advance_data.notes
    
    advance.updated_at = datetime.utcnow()
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(CashAdvance).where(CashAdvance.id == advance.id)
    )
    advance = result.scalar_one()
    
    return create_success_response(
        data=build_advance_response(advance),
        message="Cash advance updated successfully"
    )


@router.put("/{advance_id}/approve")
async def approve_cash_advance(
    advance_id: str,
    request: CashAdvanceApproveRequest,
    db: DatabaseSession,
    current_user: CurrentAdminUser  # Only admin can approve
):
    """
    Approve a cash advance.
    
    Changes status from PENDING to APPROVED and updates farmer's total_advances.
    Only admins can approve advances.
    """
    result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.id == advance_id,
            CashAdvance.deleted_at == None
        )
    )
    advance = result.scalar_one_or_none()
    
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADVANCE_NOT_FOUND", "message": "Cash advance not found"}
        )
    
    if advance.status != AdvanceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATUS", "message": "Only pending advances can be approved"}
        )
    
    # Update advance status
    advance.status = AdvanceStatus.APPROVED
    advance.approved_by = current_user.id
    advance.approved_at = datetime.utcnow()
    if request.notes:
        advance.notes = request.notes
    advance.updated_at = datetime.utcnow()
    
    # Update farmer's total advances
    farmer_result = await db.execute(
        select(Farmer).where(Farmer.id == advance.farmer_id)
    )
    farmer = farmer_result.scalar_one()
    farmer.total_advances = float(farmer.total_advances) + float(advance.amount)
    # Reduce balance since advance is a deduction from future settlements
    farmer.current_balance = float(farmer.current_balance) - float(advance.amount)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(CashAdvance).where(CashAdvance.id == advance.id)
    )
    advance = result.scalar_one()
    
    return create_success_response(
        data=build_advance_response(advance),
        message="Cash advance approved successfully"
    )


@router.put("/{advance_id}/reject")
async def reject_cash_advance(
    advance_id: str,
    request: CashAdvanceApproveRequest,
    db: DatabaseSession,
    current_user: CurrentAdminUser  # Only admin can reject
):
    """
    Reject a cash advance.
    
    Changes status from PENDING to REJECTED.
    Only admins can reject advances.
    """
    result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.id == advance_id,
            CashAdvance.deleted_at == None
        )
    )
    advance = result.scalar_one_or_none()
    
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADVANCE_NOT_FOUND", "message": "Cash advance not found"}
        )
    
    if advance.status != AdvanceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATUS", "message": "Only pending advances can be rejected"}
        )
    
    # Update advance status
    advance.status = AdvanceStatus.REJECTED
    advance.approved_by = current_user.id
    advance.approved_at = datetime.utcnow()
    if request.notes:
        advance.notes = request.notes
    advance.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(CashAdvance).where(CashAdvance.id == advance.id)
    )
    advance = result.scalar_one()
    
    return create_success_response(
        data=build_advance_response(advance),
        message="Cash advance rejected"
    )


@router.delete("/{advance_id}")
async def delete_cash_advance(
    advance_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Soft delete a cash advance.
    
    Only PENDING advances can be deleted.
    """
    result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.id == advance_id,
            CashAdvance.deleted_at == None
        )
    )
    advance = result.scalar_one_or_none()
    
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADVANCE_NOT_FOUND", "message": "Cash advance not found"}
        )
    
    if advance.status != AdvanceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE", "message": "Only pending advances can be deleted"}
        )
    
    # Soft delete
    advance.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": advance_id, "deleted": True},
        message="Cash advance deleted successfully"
    )


@router.get("/farmer/{farmer_id}/summary")
async def get_farmer_advance_summary(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Get advance summary for a specific farmer.
    
    Returns total pending, approved, and rejected advances.
    """
    # Validate farmer exists
    farmer_result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    if not farmer_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Get counts and totals by status
    stats_result = await db.execute(
        select(
            CashAdvance.status,
            func.count(CashAdvance.id).label("count"),
            func.sum(CashAdvance.amount).label("total")
        ).where(
            CashAdvance.farmer_id == farmer_id,
            CashAdvance.deleted_at == None
        ).group_by(CashAdvance.status)
    )
    stats = stats_result.all()
    
    # Build summary
    summary = {
        "farmer_id": farmer_id,
        "pending": {"count": 0, "total": 0.0},
        "approved": {"count": 0, "total": 0.0},
        "rejected": {"count": 0, "total": 0.0},
    }
    
    for stat in stats:
        status_key = stat.status.value if hasattr(stat.status, 'value') else stat.status
        if status_key in summary:
            summary[status_key]["count"] = stat.count
            summary[status_key]["total"] = float(stat.total or 0)
    
    return create_success_response(data=summary)
