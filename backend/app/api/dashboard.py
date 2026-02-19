"""Dashboard API routes for aggregated statistics and activity feed."""

from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, desc

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.settlement import Settlement, SettlementStatus
from app.models.cash_advance import CashAdvance, AdvanceStatus
from app.models.user import User
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/quick-stats")
async def get_quick_stats(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
):
    """
    Get quick statistics for dashboard.
    
    Returns today's entries count and total, pending settlements count,
    and pending advances count.
    """
    today = date.today()
    
    # Today's entries
    today_entries_result = await db.execute(
        select(
            func.count(DailyEntry.id).label("count"),
            func.sum(DailyEntry.quantity).label("total_quantity"),
            func.sum(DailyEntry.net_amount).label("total_amount"),
        ).where(
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date == today
        )
    )
    today_entries = today_entries_result.one()
    
    # Active farmers count
    active_farmers_result = await db.execute(
        select(func.count(Farmer.id)).where(
            Farmer.deleted_at == None,
            Farmer.is_active == True
        )
    )
    active_farmers = active_farmers_result.scalar() or 0
    
    # Pending settlements count
    pending_settlements_result = await db.execute(
        select(func.count(Settlement.id)).where(
            Settlement.deleted_at == None,
            Settlement.status.in_([
                SettlementStatus.DRAFT,
                SettlementStatus.PENDING_APPROVAL,
                SettlementStatus.APPROVED
            ])
        )
    )
    pending_settlements = pending_settlements_result.scalar() or 0
    
    # Pending advances count
    pending_advances_result = await db.execute(
        select(
            func.count(CashAdvance.id).label("count"),
            func.sum(CashAdvance.amount).label("total"),
        ).where(
            CashAdvance.deleted_at == None,
            CashAdvance.status == AdvanceStatus.PENDING
        )
    )
    pending_advances = pending_advances_result.one()
    
    # This week's total
    week_start = today - timedelta(days=today.weekday())
    week_result = await db.execute(
        select(
            func.count(DailyEntry.id).label("count"),
            func.sum(DailyEntry.net_amount).label("total"),
        ).where(
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= week_start
        )
    )
    week_stats = week_result.one()
    
    # This month's total
    month_start = today.replace(day=1)
    month_result = await db.execute(
        select(
            func.count(DailyEntry.id).label("count"),
            func.sum(DailyEntry.net_amount).label("total"),
        ).where(
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= month_start
        )
    )
    month_stats = month_result.one()
    
    return create_success_response(
        data={
            "today": {
                "entries_count": today_entries.count or 0,
                "total_quantity": float(today_entries.total_quantity or 0),
                "total_amount": float(today_entries.total_amount or 0),
            },
            "active_farmers": active_farmers,
            "pending_settlements": pending_settlements,
            "pending_advances": {
                "count": pending_advances.count or 0,
                "total": float(pending_advances.total or 0),
            },
            "this_week": {
                "entries_count": week_stats.count or 0,
                "total_amount": float(week_stats.total or 0),
            },
            "this_month": {
                "entries_count": month_stats.count or 0,
                "total_amount": float(month_stats.total or 0),
            },
        }
    )


@router.get("/activity")
async def get_activity_feed(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    days: int = Query(7, ge=1, le=30, description="Number of days to include"),
):
    """
    Get recent activity feed across all modules.
    
    Returns a combined feed of recent entries, settlements, and advances.
    """
    cutoff_date = date.today() - timedelta(days=days)
    activities = []
    
    # Recent daily entries
    entries_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= cutoff_date
        ).order_by(desc(DailyEntry.created_at)).limit(50)
    )
    entries = entries_result.scalars().all()
    
    for entry in entries:
        activities.append({
            "type": "entry",
            "id": entry.id,
            "timestamp": entry.created_at.isoformat(),
            "date": entry.entry_date.isoformat(),
            "farmer_id": entry.farmer_id,
            "farmer_name": entry.farmer.name if entry.farmer else None,
            "description": f"Entry: {float(entry.quantity):.2f} kg",
            "amount": float(entry.net_amount),
            "created_by": entry.created_by,
        })
    
    # Recent settlements
    settlements_result = await db.execute(
        select(Settlement).where(
            Settlement.deleted_at == None,
            Settlement.settlement_date >= cutoff_date
        ).order_by(desc(Settlement.created_at)).limit(50)
    )
    settlements = settlements_result.scalars().all()
    
    for settlement in settlements:
        activities.append({
            "type": "settlement",
            "id": settlement.id,
            "timestamp": settlement.created_at.isoformat(),
            "date": settlement.settlement_date.isoformat(),
            "farmer_id": settlement.farmer_id,
            "farmer_name": settlement.farmer.name if settlement.farmer else None,
            "description": f"Settlement: {settlement.settlement_number}",
            "status": settlement.status,
            "amount": float(settlement.net_payable),
            "created_by": settlement.created_by,
        })
    
    # Recent cash advances
    advances_result = await db.execute(
        select(CashAdvance).where(
            CashAdvance.deleted_at == None,
            CashAdvance.advance_date >= cutoff_date
        ).order_by(desc(CashAdvance.created_at)).limit(50)
    )
    advances = advances_result.scalars().all()
    
    for advance in advances:
        activities.append({
            "type": "advance",
            "id": advance.id,
            "timestamp": advance.created_at.isoformat(),
            "date": advance.advance_date.isoformat(),
            "farmer_id": advance.farmer_id,
            "farmer_name": advance.farmer.name if advance.farmer else None,
            "description": f"Advance: {advance.reason[:50]}..." if len(advance.reason) > 50 else f"Advance: {advance.reason}",
            "status": advance.status,
            "amount": float(advance.amount),
            "created_by": advance.created_by,
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Apply pagination
    total = len(activities)
    offset = (page - 1) * per_page
    paginated_activities = activities[offset:offset + per_page]
    
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
    
    return create_paginated_response(paginated_activities, pagination)


@router.get("/entries-by-date")
async def get_entries_by_date(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    days: int = Query(7, ge=1, le=30, description="Number of days to include"),
):
    """
    Get entries aggregated by date for charting.
    
    Returns daily totals for the specified number of days.
    """
    start_date = date.today() - timedelta(days=days)
    
    result = await db.execute(
        select(
            DailyEntry.entry_date,
            func.count(DailyEntry.id).label("entry_count"),
            func.sum(DailyEntry.quantity).label("total_quantity"),
            func.sum(DailyEntry.total_amount).label("gross_amount"),
            func.sum(DailyEntry.net_amount).label("net_amount"),
            func.count(func.distinct(DailyEntry.farmer_id)).label("farmer_count"),
        ).where(
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= start_date
        ).group_by(DailyEntry.entry_date).order_by(DailyEntry.entry_date)
    )
    daily_stats = result.all()
    
    return create_success_response(
        data=[
            {
                "date": stat.entry_date.isoformat(),
                "entry_count": stat.entry_count,
                "total_quantity": float(stat.total_quantity or 0),
                "gross_amount": float(stat.gross_amount or 0),
                "net_amount": float(stat.net_amount or 0),
                "farmer_count": stat.farmer_count,
            }
            for stat in daily_stats
        ]
    )


@router.get("/top-farmers")
async def get_top_farmers(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    limit: int = Query(10, ge=1, le=20, description="Number of top farmers"),
):
    """
    Get top farmers by entry amount for the specified period.
    
    Returns farmers sorted by total net amount.
    """
    start_date = date.today() - timedelta(days=days)
    
    result = await db.execute(
        select(
            Farmer.id,
            Farmer.farmer_code,
            Farmer.name,
            Farmer.village,
            func.count(DailyEntry.id).label("entry_count"),
            func.sum(DailyEntry.quantity).label("total_quantity"),
            func.sum(DailyEntry.net_amount).label("total_amount"),
        ).join(DailyEntry, Farmer.id == DailyEntry.farmer_id).where(
            Farmer.deleted_at == None,
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= start_date
        ).group_by(Farmer.id).order_by(desc("total_amount")).limit(limit)
    )
    top_farmers = result.all()
    
    return create_success_response(
        data=[
            {
                "farmer_id": stat.id,
                "farmer_code": stat.farmer_code,
                "farmer_name": stat.name,
                "village": stat.village,
                "entry_count": stat.entry_count,
                "total_quantity": float(stat.total_quantity or 0),
                "total_amount": float(stat.total_amount or 0),
            }
            for stat in top_farmers
        ]
    )


@router.get("/flower-breakdown")
async def get_flower_breakdown(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
):
    """
    Get breakdown by flower type for the specified period.
    
    Returns quantities and amounts grouped by flower type.
    """
    start_date = date.today() - timedelta(days=days)
    
    from app.models.flower_type import FlowerType
    
    result = await db.execute(
        select(
            FlowerType.id,
            FlowerType.name,
            FlowerType.name_ta,
            func.count(DailyEntry.id).label("entry_count"),
            func.sum(DailyEntry.quantity).label("total_quantity"),
            func.sum(DailyEntry.net_amount).label("total_amount"),
        ).join(DailyEntry, FlowerType.id == DailyEntry.flower_type_id).where(
            FlowerType.deleted_at == None,
            DailyEntry.deleted_at == None,
            DailyEntry.entry_date >= start_date
        ).group_by(FlowerType.id).order_by(desc("total_amount"))
    )
    flower_stats = result.all()
    
    return create_success_response(
        data=[
            {
                "flower_type_id": stat.id,
                "flower_type": stat.name,
                "flower_type_ta": stat.name_ta,
                "entry_count": stat.entry_count,
                "total_quantity": float(stat.total_quantity or 0),
                "total_amount": float(stat.total_amount or 0),
            }
            for stat in flower_stats
        ]
    )
