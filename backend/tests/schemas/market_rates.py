"""
Pydantic schemas for Market Rates API endpoints.

Based on docs/api-design.md Market Rates Module section.
"""

from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta
from tests.schemas.flower_types import NestedFlowerType
from tests.schemas.time_slots import NestedTimeSlot


# Aliases for test imports
NestedFlowerTypeInRate = NestedFlowerType
NestedTimeSlotInRate = NestedTimeSlot


class MarketRateResponse(BaseModel):
    """Market rate response data structure."""
    id: str = Field(description="Market rate UUID")
    flower_type_id: str = Field(description="Flower type UUID")
    time_slot_id: str = Field(description="Time slot UUID")
    flower_type: NestedFlowerType = Field(description="Flower type details")
    time_slot: NestedTimeSlot = Field(description="Time slot details")
    rate_per_unit: Decimal = Field(description="Rate per unit")
    effective_date: str = Field(description="Effective date (YYYY-MM-DD)")
    expiry_date: Optional[str] = Field(default=None, description="Expiry date (YYYY-MM-DD)")
    is_active: bool = Field(default=True, description="Whether rate is active")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class MarketRateCreate(BaseModel):
    """Create market rate request payload."""
    flower_type_id: str = Field(description="Flower type UUID")
    time_slot_id: str = Field(description="Time slot UUID")
    rate_per_unit: Decimal = Field(description="Rate per unit")
    effective_date: str = Field(description="Effective date (YYYY-MM-DD)")


class CurrentRateResponseData(BaseModel):
    """Current rate response data structure."""
    flower_type_id: str = Field(description="Flower type UUID")
    time_slot_id: str = Field(description="Time slot UUID")
    rate_per_unit: Decimal = Field(description="Rate per unit")
    effective_date: str = Field(description="Effective date (YYYY-MM-DD)")
    time_slot: NestedTimeSlot = Field(description="Time slot details")


class CurrentRateResponse(BaseModel):
    """Current rate response wrapper."""
    success: bool = True
    data: CurrentRateResponseData


class MarketRateSingleResponse(BaseModel):
    """Single market rate response wrapper."""
    success: bool = True
    data: MarketRateResponse
    message: Optional[str] = None


class MarketRateCreateResponse(BaseModel):
    """Create market rate response wrapper."""
    success: bool = True
    data: MarketRateResponse
    message: str = Field(default="Market rate created successfully")


class MarketRateListResponse(BaseModel):
    """Market rate list response with pagination."""
    success: bool = True
    data: List[MarketRateResponse]
    pagination: PaginationMeta
