"""Business profile API endpoints for white-labeling."""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentAdminUser, DatabaseSession
from app.models.business_profile import BusinessProfile
from app.schemas.all_schemas import (
    BusinessProfileCreate, BusinessProfileUpdate, BusinessProfileResponse
)

router = APIRouter(prefix="/business-profile", tags=["Business Profile"])


@router.get("/", response_model=BusinessProfileResponse)
async def get_business_profile(
    db: DatabaseSession
):
    """Get the active business profile (public endpoint for white-labeling)."""
    
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.is_active == True)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    return BusinessProfileResponse(
        id=profile.id,
        shop_name=profile.shop_name,
        owner_name=profile.owner_name,
        address_line1=profile.address_line1,
        address_line2=profile.address_line2,
        city=profile.city,
        state=profile.state,
        pincode=profile.pincode,
        phone=profile.phone,
        alternate_phone=profile.alternate_phone,
        email=profile.email,
        gst_number=profile.gst_number,
        pan_number=profile.pan_number,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_code=profile.bank_ifsc_code,
        bank_branch=profile.bank_branch,
        upi_id=profile.upi_id,
        logo_url=profile.logo_url,
        invoice_prefix=profile.invoice_prefix,
        invoice_notes=profile.invoice_notes,
        invoice_terms=profile.invoice_terms,
        is_active=profile.is_active,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/all")
async def list_business_profiles(
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """List all business profiles (admin only)."""
    
    result = await db.execute(
        select(BusinessProfile).order_by(BusinessProfile.created_at.desc())
    )
    profiles = result.scalars().all()
    
    return {
        "success": True,
        "data": [
            BusinessProfileResponse(
                id=p.id,
                shop_name=p.shop_name,
                owner_name=p.owner_name,
                address_line1=p.address_line1,
                address_line2=p.address_line2,
                city=p.city,
                state=p.state,
                pincode=p.pincode,
                phone=p.phone,
                alternate_phone=p.alternate_phone,
                email=p.email,
                gst_number=p.gst_number,
                pan_number=p.pan_number,
                bank_name=p.bank_name,
                bank_account_number=p.bank_account_number,
                bank_ifsc_code=p.bank_ifsc_code,
                bank_branch=p.bank_branch,
                upi_id=p.upi_id,
                logo_url=p.logo_url,
                invoice_prefix=p.invoice_prefix,
                invoice_notes=p.invoice_notes,
                invoice_terms=p.invoice_terms,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at
            ) for p in profiles
        ]
    }


@router.post("/", response_model=BusinessProfileResponse)
async def create_business_profile(
    profile_data: BusinessProfileCreate,
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """Create a new business profile (admin only)."""
    
    # Check if an active profile already exists
    if profile_data.is_active or True:  # New profiles are active by default
        result = await db.execute(
            select(BusinessProfile).where(BusinessProfile.is_active == True)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Deactivate existing profile
            existing.is_active = False
    
    # Create new profile
    profile = BusinessProfile(
        id=str(uuid.uuid4()),
        shop_name=profile_data.shop_name,
        owner_name=profile_data.owner_name,
        address_line1=profile_data.address_line1,
        address_line2=profile_data.address_line2,
        city=profile_data.city,
        state=profile_data.state,
        pincode=profile_data.pincode,
        phone=profile_data.phone,
        alternate_phone=profile_data.alternate_phone,
        email=profile_data.email,
        gst_number=profile_data.gst_number,
        pan_number=profile_data.pan_number,
        bank_name=profile_data.bank_name,
        bank_account_number=profile_data.bank_account_number,
        bank_ifsc_code=profile_data.bank_ifsc_code,
        bank_branch=profile_data.bank_branch,
        upi_id=profile_data.upi_id,
        logo_url=profile_data.logo_url,
        invoice_prefix=profile_data.invoice_prefix,
        invoice_notes=profile_data.invoice_notes,
        invoice_terms=profile_data.invoice_terms,
        is_active=True
    )
    
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    
    return BusinessProfileResponse(
        id=profile.id,
        shop_name=profile.shop_name,
        owner_name=profile.owner_name,
        address_line1=profile.address_line1,
        address_line2=profile.address_line2,
        city=profile.city,
        state=profile.state,
        pincode=profile.pincode,
        phone=profile.phone,
        alternate_phone=profile.alternate_phone,
        email=profile.email,
        gst_number=profile.gst_number,
        pan_number=profile.pan_number,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_code=profile.bank_ifsc_code,
        bank_branch=profile.bank_branch,
        upi_id=profile.upi_id,
        logo_url=profile.logo_url,
        invoice_prefix=profile.invoice_prefix,
        invoice_notes=profile.invoice_notes,
        invoice_terms=profile.invoice_terms,
        is_active=profile.is_active,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/{profile_id}", response_model=BusinessProfileResponse)
async def update_business_profile(
    profile_id: str,
    profile_data: BusinessProfileUpdate,
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """Update a business profile (admin only)."""
    
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Update fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)
    
    return BusinessProfileResponse(
        id=profile.id,
        shop_name=profile.shop_name,
        owner_name=profile.owner_name,
        address_line1=profile.address_line1,
        address_line2=profile.address_line2,
        city=profile.city,
        state=profile.state,
        pincode=profile.pincode,
        phone=profile.phone,
        alternate_phone=profile.alternate_phone,
        email=profile.email,
        gst_number=profile.gst_number,
        pan_number=profile.pan_number,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_code=profile.bank_ifsc_code,
        bank_branch=profile.bank_branch,
        upi_id=profile.upi_id,
        logo_url=profile.logo_url,
        invoice_prefix=profile.invoice_prefix,
        invoice_notes=profile.invoice_notes,
        invoice_terms=profile.invoice_terms,
        is_active=profile.is_active,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.post("/{profile_id}/activate")
async def activate_business_profile(
    profile_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """Activate a business profile (deactivates others)."""
    
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Deactivate all profiles
    result = await db.execute(select(BusinessProfile))
    all_profiles = result.scalars().all()
    
    for p in all_profiles:
        p.is_active = (p.id == profile_id)
    
    await db.commit()
    
    return {"success": True, "message": f"Business profile '{profile.shop_name}' activated"}


@router.delete("/{profile_id}")
async def delete_business_profile(
    profile_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """Delete a business profile (admin only)."""
    
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    if profile.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete active business profile. Activate another profile first."
        )
    
    await db.delete(profile)
    await db.commit()
    
    return {"success": True, "message": "Business profile deleted"}
