"""
Pydantic schemas for Farmers API endpoints.

Based on docs/api-design.md Farmers Module section.
"""

from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta


class NestedFarmer(BaseModel):
    """Nested farmer info in other responses."""
    farmer_code: str = Field(description="Unique farmer code")
    name: str = Field(description="Farmer name")
    phone: Optional[str] = Field(default=None, description="Phone number")


class FarmerResponse(BaseModel):
    """Farmer response data structure."""
    id: str = Field(description="Farmer UUID")
    farmer_code: str = Field(description="Unique farmer code")
    name: str = Field(description="Farmer name")
    village: str = Field(description="Village name")
    phone: str = Field(description="Phone number")
    whatsapp_number: Optional[str] = Field(default=None, description="WhatsApp number")
    address: Optional[str] = Field(default=None, description="Full address")
    current_balance: Decimal = Field(description="Current balance amount")
    total_advances: Decimal = Field(description="Total advances taken")
    total_settlements: Decimal = Field(description="Total settlements received")
    commission_pct: Decimal = Field(description="Commission percentage")
    flat_fee_monthly: Decimal = Field(description="Monthly flat fee")
    is_active: bool = Field(default=True, description="Whether farmer is active")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class FarmerCreate(BaseModel):
    """Create farmer request payload."""
    farmer_code: str = Field(description="Unique farmer code")
    name: str = Field(description="Farmer name")
    village: str = Field(description="Village name")
    phone: str = Field(description="Phone number")
    whatsapp_number: Optional[str] = Field(default=None, description="WhatsApp number")
    address: Optional[str] = Field(default=None, description="Full address")
    commission_pct: Decimal = Field(default=Decimal("10.00"), description="Commission percentage")
    flat_fee_monthly: Decimal = Field(default=Decimal("0.00"), description="Monthly flat fee")


class FarmerUpdate(BaseModel):
    """Update farmer request payload."""
    name: Optional[str] = Field(default=None, description="Farmer name")
    village: Optional[str] = Field(default=None, description="Village name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    whatsapp_number: Optional[str] = Field(default=None, description="WhatsApp number")
    address: Optional[str] = Field(default=None, description="Full address")
    commission_pct: Optional[Decimal] = Field(default=None, description="Commission percentage")
    flat_fee_monthly: Optional[Decimal] = Field(default=None, description="Monthly flat fee")


class FarmerBalance(BaseModel):
    """Farmer balance response data."""
    farmer_id: str = Field(description="Farmer UUID")
    current_balance: Decimal = Field(description="Current balance amount")
    total_advances: Decimal = Field(description="Total advances taken")
    total_settlements: Decimal = Field(description="Total settlements received")
    last_updated: str = Field(description="Last update timestamp (ISO 8601)")


class FarmerSingleResponse(BaseModel):
    """Single farmer response wrapper."""
    success: bool = True
    data: FarmerResponse
    message: Optional[str] = None


class FarmerCreateResponse(BaseModel):
    """Create farmer response wrapper."""
    success: bool = True
    data: FarmerResponse
    message: str = Field(default="Farmer created successfully")


class FarmerUpdateResponse(BaseModel):
    """Update farmer response wrapper."""
    success: bool = True
    data: FarmerResponse
    message: str = Field(default="Farmer updated successfully")


class FarmerDeleteResponse(BaseModel):
    """Delete farmer response wrapper."""
    success: bool = True
    message: str = Field(default="Farmer deleted successfully")


class FarmerBalanceResponse(BaseModel):
    """Farmer balance response wrapper."""
    success: bool = True
    data: FarmerBalance


class FarmerListResponse(BaseModel):
    """Farmer list response with pagination."""
    success: bool = True
    data: List[FarmerResponse]
    pagination: PaginationMeta
