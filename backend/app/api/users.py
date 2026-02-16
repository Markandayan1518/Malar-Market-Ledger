"""User management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, CurrentAdminUser, DatabaseSession
from app.models.user import User, UserRole
from app.schemas.common import create_success_response

router = APIRouter(tags=["Users"])


@router.get("/me")
async def get_current_user_info(
    current_user: CurrentUser
):
    """Get current user information."""
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": role_value,
        "language_preference": current_user.language_preference,
        "is_active": current_user.is_active
    }


@router.get("/")
async def list_users(
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """List all users (admin only)."""
    result = await db.execute(select(User).where(User.deleted_at == None))
    users = result.scalars().all()
    return {"users": [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role.value if hasattr(u.role, 'value') else u.role} for u in users]}
