"""System settings API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentAdminUser, DatabaseSession
from app.models.system_setting import SystemSetting
from app.schemas.common import create_success_response

router = APIRouter(tags=["System Settings"])


@router.get("/")
async def list_settings(
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """List all system settings."""
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    return {"settings": [{"key": s.key, "value": s.value, "description": s.description} for s in settings]}
