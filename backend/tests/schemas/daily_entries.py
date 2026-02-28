"""
Pydantic schemas for Daily Entries API endpoints.

Based on docs/api-design.md Daily Entries Module section.
"""

from typing import Optional, List
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta
from tests.schemas.farmers import NestedFarmer
from tests.schemas.flower_types import NestedFlowerType
from tests.schemas.time_slots import NestedTimeSlot


class AdjustmentReasonCode(str, Enum):
    """Adjustment reason codes for daily entries."""
    LATE = "LATE"
    WET = "WET"
    QUALITY = "QUALITY"
    BONUS = "BONUS"
    OTHER = "OTHER"


class DailyEntryCreate(BaseModel):
    """Create daily entry request payload."""
    farmer_id: str = Field(description="Farmer UUID")
    flower_type_id: str = Field(description="Flower type UUID")
    entry_date: str = Field(description="Entry date (YYYY-MM-DD)")
    entry_time: str = Field(description="Entry time (HH:MM:SS)")
    quantity: Decimal = Field(gt=0, description="Quantity")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    manual_adj_amount: Optional[Decimal] = Field(default=Decimal("0.00"), description="Manual adjustment amount")
    adj_reason_code: Optional[AdjustmentReasonCode] = Field(default=None, description="Adjustment reason code")


class DailyEntryUpdate(BaseModel):
    """Update daily entry request payload."""
    quantity: Optional[Decimal] = Field(default=None, gt=0, description="Quantity")
    entry_time: Optional[str] = Field(default=None, description="Entry time (HH:MM:SS)")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    manual_adj_amount: Optional[Decimal] = Field(default=None, description="Manual adjustment amount")
    adj_reason_code: Optional[AdjustmentReasonCode] = Field(default=None, description="Adjustment reason code")


class DailyEntryResponse(BaseModel):
    """Daily entry response data structure."""
    id: str = Field(description="Daily entry UUID")
    farmer_id: str = Field(description="Farmer UUID")
    farmer: NestedFarmer = Field(description="Farmer details")
    flower_type_id: str = Field(description="Flower type UUID")
    flower_type: NestedFlowerType = Field(description="Flower type details")
    time_slot_id: str = Field(description="Time slot UUID")
    time_slot: NestedTimeSlot = Field(description="Time slot details")
    entry_date: str = Field(description="Entry date (YYYY-MM-DD)")
    entry_time: str = Field(description="Entry time (HH:MM:SS)")
    quantity: Decimal = Field(description="Quantity")
    rate_per_unit: Decimal = Field(description="Rate per unit")
    total_amount: Decimal = Field(description="Total amount")
    commission_rate: Decimal = Field(description="Commission rate")
    commission_amount: Decimal = Field(description="Commission amount")
    manual_adj_amount: Decimal = Field(description="Manual adjustment amount")
    adj_reason_code: Optional[AdjustmentReasonCode] = Field(default=None, description="Adjustment reason code")
    net_amount: Decimal = Field(description="Net amount")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    created_by: str = Field(description="Creator user UUID")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class DailyEntrySingleResponse(BaseModel):
    """Single daily entry response wrapper."""
    success: bool = True
    data: DailyEntryResponse
    message: Optional[str] = None


class DailyEntryCreateResponse(BaseModel):
    """Create daily entry response wrapper."""
    success: bool = True
    data: DailyEntryResponse
    message: str = Field(default="Daily entry created successfully")


class DailyEntryUpdateResponse(BaseModel):
    """Update daily entry response wrapper."""
    success: bool = True
    data: DailyEntryResponse
    message: str = Field(default="Daily entry updated successfully")


class DailyEntryDeleteResponse(BaseModel):
    """Delete daily entry response wrapper."""
    success: bool = True
    message: str = Field(default="Daily entry deleted successfully")


class DailyEntryListResponse(BaseModel):
    """Daily entry list response with pagination."""
    success: bool = True
    data: List[DailyEntryResponse]
    pagination: PaginationMeta
