"""User management API routes."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from passlib.context import CryptContext

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
from app.models.user import User, UserRole
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

router = APIRouter(prefix="/users", tags=["Users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/me")
async def get_current_user_info(
    current_user: CurrentUser
):
    """Get current user information."""
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    return create_success_response({
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": role_value,
        "language_preference": current_user.language_preference,
        "theme_preference": getattr(current_user, 'theme_preference', 'arctic'),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    })


@router.put("/me")
async def update_current_user(
    db: DatabaseSession,
    current_user: CurrentUser,
    full_name: Optional[str] = Query(None, min_length=1, max_length=200),
    language_preference: Optional[str] = Query(None, pattern="^(en|ta)$"),
    theme_preference: Optional[str] = Query(None, pattern="^(arctic|warm)$"),
):
    """Update current user profile."""
    if full_name is not None:
        current_user.full_name = full_name
    
    if language_preference is not None:
        current_user.language_preference = language_preference
    
    if theme_preference is not None:
        current_user.theme_preference = theme_preference
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    return create_success_response({
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": role_value,
        "language_preference": current_user.language_preference,
        "theme_preference": getattr(current_user, 'theme_preference', 'arctic'),
        "is_active": current_user.is_active,
    })


@router.put("/me/password")
async def change_password(
    db: DatabaseSession,
    current_user: CurrentUser,
    current_password: str = Query(..., min_length=6),
    new_password: str = Query(..., min_length=6),
):
    """Change current user password."""
    # Verify current password
    if not pwd_context.verify(current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = pwd_context.hash(new_password)
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "Password changed successfully"})


@router.get("/me/preferences")
async def get_user_preferences(
    current_user: CurrentUser
):
    """Get current user preferences."""
    return create_success_response({
        "language": current_user.language_preference,
        "theme": getattr(current_user, 'theme_preference', 'arctic'),
        "notifications_enabled": getattr(current_user, 'notifications_enabled', True),
    })


@router.put("/me/preferences")
async def update_user_preferences(
    db: DatabaseSession,
    current_user: CurrentUser,
    language: Optional[str] = Query(None, pattern="^(en|ta)$"),
    theme: Optional[str] = Query(None, pattern="^(arctic|warm)$"),
    notifications_enabled: Optional[bool] = Query(None),
):
    """Update current user preferences."""
    if language is not None:
        current_user.language_preference = language
    
    if theme is not None:
        current_user.theme_preference = theme
    
    if notifications_enabled is not None:
        current_user.notifications_enabled = notifications_enabled
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({
        "language": current_user.language_preference,
        "theme": getattr(current_user, 'theme_preference', 'arctic'),
        "notifications_enabled": getattr(current_user, 'notifications_enabled', True),
    })


@router.get("/")
async def list_users(
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """List all users with pagination (admin only)."""
    query = select(User).where(User.deleted_at == None)
    
    if search:
        query = query.where(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    if role:
        try:
            role_enum = UserRole(role)
            query = query.where(User.role == role_enum)
        except ValueError:
            pass
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
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
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "is_active": u.is_active,
                "language_preference": u.language_preference,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        pagination,
    )


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Get user by ID (admin only)."""
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.deleted_at == None)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return create_success_response({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "language_preference": user.language_preference,
        "theme_preference": getattr(user, 'theme_preference', 'arctic'),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    })


@router.post("/")
async def create_user(
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    email: str = Query(..., max_length=255),
    password: str = Query(..., min_length=6),
    full_name: str = Query(..., min_length=1, max_length=200),
    role: str = Query(..., pattern="^(admin|staff|viewer)$"),
):
    """Create a new user (admin only)."""
    import uuid
    
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == email).where(User.deleted_at == None)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        role_enum = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=pwd_context.hash(password),
        full_name=full_name,
        role=role_enum,
        is_active=True,
        language_preference="en",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return create_success_response({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }, status_code=201)


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    full_name: Optional[str] = Query(None, min_length=1, max_length=200),
    role: Optional[str] = Query(None, pattern="^(admin|staff|viewer)$"),
    is_active: Optional[bool] = Query(None),
):
    """Update a user (admin only)."""
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.deleted_at == None)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if full_name is not None:
        user.full_name = full_name
    
    if role is not None:
        try:
            user.role = UserRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    
    if is_active is not None:
        user.is_active = is_active
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    return create_success_response({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
    })


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Soft delete a user (admin only)."""
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.deleted_at == None)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user.deleted_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "User deleted successfully"})


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    new_password: str = Query(..., min_length=6),
):
    """Reset a user's password (admin only)."""
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.deleted_at == None)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = pwd_context.hash(new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()
    
    return create_success_response({"message": "Password reset successfully"})
