"""System settings API routes."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.dependencies import CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
from app.models.system_setting import SystemSetting
from app.schemas.common import create_success_response

router = APIRouter(prefix="/system-settings", tags=["System Settings"])


@router.get("/")
async def list_settings(
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """List all system settings (admin only)."""
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    
    return create_success_response([
        {
            "key": s.key,
            "value": s.value,
            "description": s.description,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in settings
    ])


@router.get("/public")
async def get_public_settings(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get public system settings (all authenticated users)."""
    # Define which settings are safe to expose to all users
    public_keys = [
        "business_name",
        "business_address",
        "business_phone",
        "currency_symbol",
        "default_language",
        "default_theme",
    ]
    
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key.in_(public_keys))
    )
    settings = result.scalars().all()
    
    return create_success_response({
        s.key: s.value
        for s in settings
    })


@router.get("/{key}")
async def get_setting(
    key: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Get a specific system setting by key (admin only)."""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return create_success_response({
        "key": setting.key,
        "value": setting.value,
        "description": setting.description,
        "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
    })


@router.put("/{key}")
async def update_setting(
    key: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    value: str = Query(...),
    description: Optional[str] = Query(None),
):
    """Update or create a system setting (admin only)."""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalar_one_or_none()
    
    if setting:
        setting.value = value
        if description is not None:
            setting.description = description
        setting.updated_at = datetime.utcnow()
    else:
        setting = SystemSetting(
            key=key,
            value=value,
            description=description,
        )
        db.add(setting)
    
    await db.commit()
    await db.refresh(setting)
    
    return create_success_response({
        "key": setting.key,
        "value": setting.value,
        "description": setting.description,
        "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
    })


@router.delete("/{key}")
async def delete_setting(
    key: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser,
):
    """Delete a system setting (admin only)."""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    await db.delete(setting)
    await db.commit()
    
    return create_success_response({"message": "Setting deleted successfully"})


@router.post("/bulk")
async def update_settings_bulk(
    db: DatabaseSession,
    current_user: CurrentAdminUser,
    settings: dict = None,
):
    """Update multiple system settings at once (admin only)."""
    if not settings:
        raise HTTPException(status_code=400, detail="No settings provided")
    
    updated_settings = []
    
    for key, value in settings.items():
        result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.utcnow()
        else:
            setting = SystemSetting(
                key=key,
                value=str(value),
            )
            db.add(setting)
        
        updated_settings.append(key)
    
    await db.commit()
    
    return create_success_response({
        "message": "Settings updated successfully",
        "updated_keys": updated_settings,
    })


# Business profile endpoints (convenience aliases)
@router.get("/business/profile")
async def get_business_profile(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get business profile settings."""
    business_keys = [
        "business_name",
        "business_address",
        "business_phone",
        "business_email",
        "business_gst",
        "currency_symbol",
    ]
    
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key.in_(business_keys))
    )
    settings = result.scalars().all()
    
    profile = {key: "" for key in business_keys}
    for s in settings:
        profile[s.key] = s.value
    
    return create_success_response(profile)


@router.put("/business/profile")
async def update_business_profile(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    business_name: Optional[str] = Query(None, max_length=200),
    business_address: Optional[str] = Query(None, max_length=500),
    business_phone: Optional[str] = Query(None, max_length=50),
    business_email: Optional[str] = Query(None, max_length=200),
    business_gst: Optional[str] = Query(None, max_length=50),
    currency_symbol: Optional[str] = Query(None, max_length=10),
):
    """Update business profile settings."""
    updates = {
        "business_name": business_name,
        "business_address": business_address,
        "business_phone": business_phone,
        "business_email": business_email,
        "business_gst": business_gst,
        "currency_symbol": currency_symbol,
    }
    
    for key, value in updates.items():
        if value is not None:
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            setting = result.scalar_one_or_none()
            
            if setting:
                setting.value = value
                setting.updated_at = datetime.utcnow()
            else:
                setting = SystemSetting(key=key, value=value)
                db.add(setting)
    
    await db.commit()
    
    return create_success_response({"message": "Business profile updated successfully"})
