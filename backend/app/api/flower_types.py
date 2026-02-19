"""Flower type management API routes."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
from app.models.flower_type import FlowerType
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/flower-types", tags=["Flower Types"])


@router.get("/")
async def list_flower_types(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """List all flower types with pagination."""
    query = select(FlowerType).where(FlowerType.deleted_at == None)
    
    if search:
        query = query.where(FlowerType.name.ilike(f"%{search}%"))
    
    if is_active is not None:
        query = query.where(FlowerType.is_active == is_active)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(FlowerType.name)
    
    result = await db.execute(query)
    flower_types = result.scalars().all()
    
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
                "id": ft.id,
                "name": ft.name,
                "name_ta": ft.name_ta,
                "unit": ft.unit,
                "is_active": ft.is_active,
                "created_at": ft.created_at.isoformat() if ft.created_at else None,
            }
            for ft in flower_types
        ],
        pagination,
    )


@router.get("/active")
async def list_active_flower_types(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """List all active flower types for dropdowns."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.deleted_at == None)
        .where(FlowerType.is_active == True)
        .order_by(FlowerType.name)
    )
    flower_types = result.scalars().all()
    
    return create_success_response(
        [
            {
                "id": ft.id,
                "name": ft.name,
                "name_ta": ft.name_ta,
                "unit": ft.unit,
            }
            for ft in flower_types
        ]
    )


@router.get("/{flower_type_id}")
async def get_flower_type(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get flower type by ID."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.id == flower_type_id)
        .where(FlowerType.deleted_at == None)
    )
    flower_type = result.scalar_one_or_none()
    
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    
    return create_success_response({
        "id": flower_type.id,
        "name": flower_type.name,
        "name_ta": flower_type.name_ta,
        "unit": flower_type.unit,
        "is_active": flower_type.is_active,
        "created_at": flower_type.created_at.isoformat() if flower_type.created_at else None,
        "updated_at": flower_type.updated_at.isoformat() if flower_type.updated_at else None,
    })


@router.post("/")
async def create_flower_type(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    name: str = Query(..., min_length=1, max_length=100),
    name_ta: str = Query(..., min_length=1, max_length=100, description="Tamil name"),
    unit: str = Query("kg", max_length=20),
):
    """Create a new flower type."""
    import uuid
    
    flower_type = FlowerType(
        id=str(uuid.uuid4()),
        name=name,
        name_ta=name_ta,
        unit=unit,
        is_active=True,
    )
    db.add(flower_type)
    await db.commit()
    await db.refresh(flower_type)
    
    return create_success_response({
        "id": flower_type.id,
        "name": flower_type.name,
        "name_ta": flower_type.name_ta,
        "unit": flower_type.unit,
        "is_active": flower_type.is_active,
    }, status_code=201)


@router.put("/{flower_type_id}")
async def update_flower_type(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    name: Optional[str] = Query(None, min_length=1, max_length=100),
    name_ta: Optional[str] = Query(None, min_length=1, max_length=100),
    unit: Optional[str] = Query(None, max_length=20),
):
    """Update a flower type."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.id == flower_type_id)
        .where(FlowerType.deleted_at == None)
    )
    flower_type = result.scalar_one_or_none()
    
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    
    if name is not None:
        flower_type.name = name
    if name_ta is not None:
        flower_type.name_ta = name_ta
    if unit is not None:
        flower_type.unit = unit
    
    flower_type.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(flower_type)
    
    return create_success_response({
        "id": flower_type.id,
        "name": flower_type.name,
        "name_ta": flower_type.name_ta,
        "unit": flower_type.unit,
        "is_active": flower_type.is_active,
    })


@router.delete("/{flower_type_id}")
async def delete_flower_type(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Soft delete a flower type."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.id == flower_type_id)
        .where(FlowerType.deleted_at == None)
    )
    flower_type = result.scalar_one_or_none()
    
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    
    flower_type.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "Flower type deleted successfully"})


@router.patch("/{flower_type_id}/deactivate")
async def deactivate_flower_type(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
):
    """Deactivate a flower type."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.id == flower_type_id)
        .where(FlowerType.deleted_at == None)
    )
    flower_type = result.scalar_one_or_none()
    
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    
    flower_type.is_active = False
    flower_type.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "id": flower_type.id,
        "is_active": False,
    })


@router.patch("/{flower_type_id}/activate")
async def activate_flower_type(
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
):
    """Activate a flower type."""
    result = await db.execute(
        select(FlowerType)
        .where(FlowerType.id == flower_type_id)
        .where(FlowerType.deleted_at == None)
    )
    flower_type = result.scalar_one_or_none()
    
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    
    flower_type.is_active = True
    flower_type.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "id": flower_type.id,
        "is_active": True,
    })
