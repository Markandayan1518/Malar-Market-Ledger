"""Farmer management API routes."""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, DatabaseSession
from app.models.farmer import Farmer
from app.models.daily_entry import DailyEntry
from app.models.cash_advance import CashAdvance
from app.models.settlement import Settlement
from app.models.flower_type import FlowerType
from app.models.farmer_product import FarmerProduct
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta
from app.schemas.all_schemas import (
    FarmerCreate,
    FarmerUpdate,
    FarmerResponse,
    FarmerProductCreate,
    FarmerProductBatchCreate,
    FarmerProductResponse,
    FarmerProductListResponse,
    SuggestedFlowerResponse,
    FlowerTypeResponse,
)

router = APIRouter(tags=["Farmers"])


@router.get("/")
async def list_farmers(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search by name, phone, or farmer_code"),
    is_active: bool = Query(None, description="Filter by active status"),
    village: str = Query(None, description="Filter by village"),
):
    """
    List all farmers with pagination and filtering.
    
    Returns farmers in standard response envelope format.
    """
    # Base query with soft delete filter
    query = select(Farmer).where(Farmer.deleted_at == None)
    count_query = select(func.count(Farmer.id)).where(Farmer.deleted_at == None)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Farmer.name.ilike(search_term),
                Farmer.phone.ilike(search_term),
                Farmer.farmer_code.ilike(search_term),
            )
        )
        count_query = count_query.where(
            or_(
                Farmer.name.ilike(search_term),
                Farmer.phone.ilike(search_term),
                Farmer.farmer_code.ilike(search_term),
            )
        )
    
    if is_active is not None:
        query = query.where(Farmer.is_active == is_active)
        count_query = count_query.where(Farmer.is_active == is_active)
    
    if village:
        query = query.where(Farmer.village.ilike(f"%{village}%"))
        count_query = count_query.where(Farmer.village.ilike(f"%{village}%"))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.order_by(Farmer.created_at.desc()).offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    farmers = result.scalars().all()
    
    # Build response
    farmer_responses = [
        FarmerResponse(
            id=f.id,
            farmer_code=f.farmer_code,
            name=f.name,
            village=f.village,
            phone=f.phone,
            whatsapp_number=f.whatsapp_number,
            address=f.address,
            current_balance=f.current_balance,
            total_advances=f.total_advances,
            total_settlements=f.total_settlements,
            is_active=f.is_active,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )
        for f in farmers
    ]
    
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
    
    return create_paginated_response(farmer_responses, pagination)


@router.get("/search")
async def search_farmers(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
):
    """
    Quick search endpoint for autocomplete.
    
    Returns simplified farmer list for dropdowns and autocomplete fields.
    """
    search_term = f"%{q}%"
    query = select(Farmer).where(
        Farmer.deleted_at == None,
        Farmer.is_active == True,
        or_(
            Farmer.name.ilike(search_term),
            Farmer.phone.ilike(search_term),
            Farmer.farmer_code.ilike(search_term),
        )
    ).order_by(Farmer.name).limit(limit)
    
    result = await db.execute(query)
    farmers = result.scalars().all()
    
    # Return simplified format for autocomplete
    return create_success_response(
        data=[
            {
                "id": f.id,
                "name": f.name,
                "farmer_code": f.farmer_code,
                "phone": f.phone,
                "village": f.village,
                "current_balance": float(f.current_balance),
            }
            for f in farmers
        ],
        message=f"Found {len(farmers)} farmers"
    )


@router.get("/{farmer_id}")
async def get_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get farmer by ID with standard response format."""
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    return create_success_response(
        data=FarmerResponse(
            id=farmer.id,
            farmer_code=farmer.farmer_code,
            name=farmer.name,
            village=farmer.village,
            phone=farmer.phone,
            whatsapp_number=farmer.whatsapp_number,
            address=farmer.address,
            current_balance=farmer.current_balance,
            total_advances=farmer.total_advances,
            total_settlements=farmer.total_settlements,
            is_active=farmer.is_active,
            created_at=farmer.created_at,
            updated_at=farmer.updated_at,
        )
    )


@router.get("/{farmer_id}/balance")
async def get_farmer_balance(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Get farmer balance information.
    
    Returns current balance, pending advances, and recent activity summary.
    """
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Get pending advances count
    pending_advances_result = await db.execute(
        select(func.count(CashAdvance.id)).where(
            CashAdvance.farmer_id == farmer_id,
            CashAdvance.status == "pending",
            CashAdvance.deleted_at == None
        )
    )
    pending_advances_count = pending_advances_result.scalar() or 0
    
    # Get pending settlements count
    pending_settlements_result = await db.execute(
        select(func.count(Settlement.id)).where(
            Settlement.farmer_id == farmer_id,
            Settlement.status.in_(["draft", "pending_approval"]),
            Settlement.deleted_at == None
        )
    )
    pending_settlements_count = pending_settlements_result.scalar() or 0
    
    # Get today's entries count
    today = datetime.utcnow().date()
    today_entries_result = await db.execute(
        select(func.count(DailyEntry.id)).where(
            DailyEntry.farmer_id == farmer_id,
            DailyEntry.entry_date == today,
            DailyEntry.deleted_at == None
        )
    )
    today_entries_count = today_entries_result.scalar() or 0
    
    return create_success_response(
        data={
            "farmer_id": farmer.id,
            "farmer_name": farmer.name,
            "current_balance": float(farmer.current_balance),
            "total_advances": float(farmer.total_advances),
            "total_settlements": float(farmer.total_settlements),
            "pending_advances_count": pending_advances_count,
            "pending_settlements_count": pending_settlements_count,
            "today_entries_count": today_entries_count,
        }
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_farmer(
    farmer_data: FarmerCreate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Create a new farmer.
    
    Generates a unique farmer_code if not provided.
    """
    # Check for duplicate phone
    existing_phone = await db.execute(
        select(Farmer).where(
            Farmer.phone == farmer_data.phone,
            Farmer.deleted_at == None
        )
    )
    if existing_phone.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PHONE_EXISTS", "message": "A farmer with this phone number already exists"}
        )
    
    # Check for duplicate farmer_code if provided
    if farmer_data.farmer_code:
        existing_code = await db.execute(
            select(Farmer).where(
                Farmer.farmer_code == farmer_data.farmer_code,
                Farmer.deleted_at == None
            )
        )
        if existing_code.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CODE_EXISTS", "message": "A farmer with this code already exists"}
            )
    
    # Create farmer
    farmer = Farmer(
        id=str(uuid.uuid4()),
        farmer_code=farmer_data.farmer_code,
        name=farmer_data.name,
        village=farmer_data.village,
        phone=farmer_data.phone,
        whatsapp_number=farmer_data.whatsapp_number,
        address=farmer_data.address,
        current_balance=0.00,
        total_advances=0.00,
        total_settlements=0.00,
        is_active=True,
    )
    
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)
    
    return create_success_response(
        data=FarmerResponse(
            id=farmer.id,
            farmer_code=farmer.farmer_code,
            name=farmer.name,
            village=farmer.village,
            phone=farmer.phone,
            whatsapp_number=farmer.whatsapp_number,
            address=farmer.address,
            current_balance=farmer.current_balance,
            total_advances=farmer.total_advances,
            total_settlements=farmer.total_settlements,
            is_active=farmer.is_active,
            created_at=farmer.created_at,
            updated_at=farmer.updated_at,
        ),
        message="Farmer created successfully"
    )


@router.put("/{farmer_id}")
async def update_farmer(
    farmer_id: str,
    farmer_data: FarmerUpdate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Update farmer information."""
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Check for duplicate phone if updating
    if farmer_data.phone and farmer_data.phone != farmer.phone:
        existing_phone = await db.execute(
            select(Farmer).where(
                Farmer.phone == farmer_data.phone,
                Farmer.id != farmer_id,
                Farmer.deleted_at == None
            )
        )
        if existing_phone.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "PHONE_EXISTS", "message": "A farmer with this phone number already exists"}
            )
    
    # Update fields
    update_data = farmer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farmer, field, value)
    
    farmer.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(farmer)
    
    return create_success_response(
        data=FarmerResponse(
            id=farmer.id,
            farmer_code=farmer.farmer_code,
            name=farmer.name,
            village=farmer.village,
            phone=farmer.phone,
            whatsapp_number=farmer.whatsapp_number,
            address=farmer.address,
            current_balance=farmer.current_balance,
            total_advances=farmer.total_advances,
            total_settlements=farmer.total_settlements,
            is_active=farmer.is_active,
            created_at=farmer.created_at,
            updated_at=farmer.updated_at,
        ),
        message="Farmer updated successfully"
    )


@router.delete("/{farmer_id}")
async def delete_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Soft delete a farmer.
    
    Sets deleted_at timestamp instead of hard delete.
    """
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Check for active dependencies
    active_entries = await db.execute(
        select(func.count(DailyEntry.id)).where(
            DailyEntry.farmer_id == farmer_id,
            DailyEntry.deleted_at == None
        )
    )
    if active_entries.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FARMER_HAS_ENTRIES",
                "message": "Cannot delete farmer with existing entries. Deactivate instead."
            }
        )
    
    # Soft delete
    farmer.deleted_at = datetime.utcnow()
    farmer.is_active = False
    await db.commit()
    
    return create_success_response(
        data={"id": farmer_id, "deleted": True},
        message="Farmer deleted successfully"
    )


@router.patch("/{farmer_id}/deactivate")
async def deactivate_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Deactivate a farmer (set is_active to False)."""
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    farmer.is_active = False
    farmer.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": farmer_id, "is_active": False},
        message="Farmer deactivated successfully"
    )


@router.patch("/{farmer_id}/activate")
async def activate_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Activate a farmer (set is_active to True)."""
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    farmer.is_active = True
    farmer.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": farmer_id, "is_active": True},
        message="Farmer activated successfully"
    )


# ==================== FARMER PRODUCTS ENDPOINTS ====================

@router.get("/{farmer_id}/products")
async def get_farmer_products(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Get all flower types linked to a farmer.
    
    Returns list of flowers the farmer typically supplies,
    with entry counts for smart suggestion ranking.
    """
    # Verify farmer exists
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Get farmer products with flower type details
    products_query = select(FarmerProduct).options(
        selectinload(FarmerProduct.flower_type)
    ).where(
        FarmerProduct.farmer_id == farmer_id,
        FarmerProduct.deleted_at == None
    ).order_by(FarmerProduct.entry_count.desc())
    
    products_result = await db.execute(products_query)
    products = products_result.scalars().all()
    
    # Build response
    product_responses = [
        FarmerProductResponse(
            id=p.id,
            farmer_id=p.farmer_id,
            flower_type_id=p.flower_type_id,
            entry_count=p.entry_count,
            last_entry_at=p.last_entry_at,
            created_at=p.created_at,
            updated_at=p.updated_at,
            flower_type=FlowerTypeResponse(
                id=p.flower_type.id,
                name=p.flower_type.name,
                name_ta=p.flower_type.name_ta,
                code=p.flower_type.code,
                description=p.flower_type.description,
                unit=p.flower_type.unit,
                is_active=p.flower_type.is_active,
                created_at=p.flower_type.created_at,
                updated_at=p.flower_type.updated_at,
            )
        )
        for p in products
    ]
    
    return create_success_response(
        data=FarmerProductListResponse(
            farmer_id=farmer_id,
            products=product_responses
        )
    )


@router.post("/{farmer_id}/products", status_code=status.HTTP_201_CREATED)
async def add_farmer_products(
    farmer_id: str,
    products_data: FarmerProductBatchCreate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Add flower types to a farmer's profile.
    
    Links multiple flowers to a farmer for smart suggestions.
    Ignores duplicates silently.
    """
    # Verify farmer exists
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Verify all flower types exist and are active
    flower_types_result = await db.execute(
        select(FlowerType).where(
            FlowerType.id.in_(products_data.flower_type_ids),
            FlowerType.deleted_at == None,
            FlowerType.is_active == True
        )
    )
    valid_flower_types = flower_types_result.scalars().all()
    valid_flower_ids = {ft.id for ft in valid_flower_types}
    
    # Get existing products to avoid duplicates
    existing_result = await db.execute(
        select(FarmerProduct.flower_type_id).where(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.deleted_at == None
        )
    )
    existing_flower_ids = {row[0] for row in existing_result.fetchall()}
    
    # Create new products
    added_count = 0
    for flower_id in products_data.flower_type_ids:
        if flower_id in valid_flower_ids and flower_id not in existing_flower_ids:
            product = FarmerProduct(
                id=str(uuid.uuid4()),
                farmer_id=farmer_id,
                flower_type_id=flower_id,
                entry_count=0,
            )
            db.add(product)
            added_count += 1
    
    await db.commit()
    
    return create_success_response(
        data={"added_count": added_count, "farmer_id": farmer_id},
        message=f"Added {added_count} flower types to farmer profile"
    )


@router.delete("/{farmer_id}/products/{product_id}")
async def remove_farmer_product(
    farmer_id: str,
    product_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Remove a flower type from a farmer's profile.
    
    Soft deletes the association.
    """
    # Verify farmer exists
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Find and soft delete the product
    product_result = await db.execute(
        select(FarmerProduct).where(
            FarmerProduct.id == product_id,
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.deleted_at == None
        )
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Farmer product not found"}
        )
    
    product.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response(
        data={"id": product_id, "removed": True},
        message="Flower type removed from farmer profile"
    )


@router.get("/{farmer_id}/suggested-flower")
async def get_suggested_flower(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """
    Get suggested flower type for a farmer based on history.
    
    Returns the most commonly supplied flower for quick entry.
    If farmer has only one linked flower, returns that.
    If no history, returns all active flowers for selection.
    """
    # Verify farmer exists
    result = await db.execute(
        select(Farmer).where(
            Farmer.id == farmer_id,
            Farmer.deleted_at == None
        )
    )
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FARMER_NOT_FOUND", "message": "Farmer not found"}
        )
    
    # Get farmer products ordered by entry count
    products_query = select(FarmerProduct).options(
        selectinload(FarmerProduct.flower_type)
    ).where(
        FarmerProduct.farmer_id == farmer_id,
        FarmerProduct.deleted_at == None,
        FarmerProduct.flower_type.has(FlowerType.is_active == True),
        FarmerProduct.flower_type.has(FlowerType.deleted_at == None)
    ).order_by(FarmerProduct.entry_count.desc())
    
    products_result = await db.execute(products_query)
    products = products_result.scalars().all()
    
    if not products:
        # No linked flowers - return all active flowers for selection
        all_flowers_result = await db.execute(
            select(FlowerType).where(
                FlowerType.is_active == True,
                FlowerType.deleted_at == None
            ).order_by(FlowerType.name)
        )
        all_flowers = all_flowers_result.scalars().all()
        
        return create_success_response(
            data={
                "has_suggestion": False,
                "suggestions": [
                    SuggestedFlowerResponse(
                        flower_type=FlowerTypeResponse(
                            id=f.id,
                            name=f.name,
                            name_ta=f.name_ta,
                            code=f.code,
                            description=f.description,
                            unit=f.unit,
                            is_active=f.is_active,
                            created_at=f.created_at,
                            updated_at=f.updated_at,
                        ),
                        entry_count=0,
                        last_entry_at=None,
                        is_primary=False
                    )
                    for f in all_flowers
                ]
            },
            message="No linked flowers found. Showing all active flowers."
        )
    
    # Build suggestions with primary flag
    max_count = products[0].entry_count if products else 0
    suggestions = []
    
    for p in products:
        suggestions.append(
            SuggestedFlowerResponse(
                flower_type=FlowerTypeResponse(
                    id=p.flower_type.id,
                    name=p.flower_type.name,
                    name_ta=p.flower_type.name_ta,
                    code=p.flower_type.code,
                    description=p.flower_type.description,
                    unit=p.flower_type.unit,
                    is_active=p.flower_type.is_active,
                    created_at=p.flower_type.created_at,
                    updated_at=p.flower_type.updated_at,
                ),
                entry_count=p.entry_count,
                last_entry_at=p.last_entry_at,
                is_primary=(p.entry_count == max_count and max_count > 0)
            )
        )
    
    # Auto-select if only one flower
    has_suggestion = len(suggestions) == 1 or (len(suggestions) > 0 and suggestions[0].is_primary)
    
    return create_success_response(
        data={
            "has_suggestion": has_suggestion,
            "suggestions": suggestions
        },
        message=f"Found {len(suggestions)} linked flower types"
    )
