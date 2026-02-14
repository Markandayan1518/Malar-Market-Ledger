"""Flower type management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, DatabaseSession
from app.models.flower_type import FlowerType
from app.schemas.common import create_success_response

router = APIRouter(tags=["Flower Types"])


@router.get("/")
async def list_flower_types(
    db: DatabaseSession
):
    """List all flower types."""
    result = await db.execute(select(FlowerType).where(FlowerType.is_active == True))
    flower_types = result.scalars().all()
    return {"flower_types": [{"id": ft.id, "name": ft.name, "name_tamil": ft.name_tamil, "unit": ft.unit} for ft in flower_types]}


@router.get("/{flower_type_id}")
async def get_flower_type(
    flower_type_id: str,
    db: DatabaseSession
):
    """Get flower type by ID."""
    result = await db.execute(select(FlowerType).where(FlowerType.id == flower_type_id))
    flower_type = result.scalar_one_or_none()
    if not flower_type:
        raise HTTPException(status_code=404, detail="Flower type not found")
    return flower_type
