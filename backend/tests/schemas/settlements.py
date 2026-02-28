"""
Pydantic schemas for Settlements API endpoints.

Based on docs/api-design.md Settlements Module section.
"""

from typing import Optional, List
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta
from tests.schemas.farmers import NestedFarmer


class SettlementStatus(str, Enum):
    """Settlement status enumeration."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PAID = "paid"


class SettlementItemResponse(BaseModel):
    """Settlement item (linked to daily entry) response."""
    id: str = Field(description="Settlement item UUID")
    daily_entry_id: str = Field(description="Daily entry UUID")
    entry_date: str = Field(description="Entry date (YYYY-MM-DD)")
    flower_type: str = Field(description="Flower type name")
    quantity: Decimal = Field(description="Quantity")
    rate_per_unit: Decimal = Field(description="Rate per unit")
    total_amount: Decimal = Field(description="Total amount")
    commission_amount: Decimal = Field(description="Commission amount")
    net_amount: Decimal = Field(description="Net amount")


class SettlementCreateRequest(BaseModel):
    """Generate settlement request payload."""
    farmer_id: str = Field(description="Farmer UUID")
    period_start: str = Field(description="Period start date (YYYY-MM-DD)")
    period_end: str = Field(description="Period end date (YYYY-MM-DD)")
    notes: Optional[str] = Field(default=None, description="Optional notes")


class SettlementApproveRequest(BaseModel):
    """Approve settlement request payload."""
    notes: Optional[str] = Field(default=None, description="Optional notes")


# Aliases for test imports
SettlementGenerate = SettlementCreateRequest
SettlementApprove = SettlementApproveRequest
SettlementItem = SettlementItemResponse


class NestedFarmerInSettlement(BaseModel):
    """Nested farmer details in settlement response."""
    farmer_code: str = Field(description="Farmer code")
    name: str = Field(description="Farmer name")
    phone: Optional[str] = Field(default=None, description="Phone number")


class SettlementResponse(BaseModel):
    """Settlement response data structure."""
    id: str = Field(description="Settlement UUID")
    farmer_id: str = Field(description="Farmer UUID")
    farmer: NestedFarmer = Field(description="Farmer details")
    settlement_date: str = Field(description="Settlement date (YYYY-MM-DD)")
    settlement_number: str = Field(description="Unique settlement number")
    period_start: str = Field(description="Period start date (YYYY-MM-DD)")
    period_end: str = Field(description="Period end date (YYYY-MM-DD)")
    total_entries: int = Field(description="Total number of entries")
    total_quantity: Decimal = Field(description="Total quantity")
    gross_amount: Decimal = Field(description="Gross amount")
    total_commission: Decimal = Field(description="Total commission")
    total_fees: Decimal = Field(description="Total fees")
    total_advances: Decimal = Field(description="Total advances deducted")
    net_payable: Decimal = Field(description="Net payable amount")
    status: SettlementStatus = Field(description="Settlement status")
    approved_by: Optional[str] = Field(default=None, description="Approver user UUID")
    approved_at: Optional[str] = Field(default=None, description="Approval timestamp (ISO 8601)")
    paid_at: Optional[str] = Field(default=None, description="Payment timestamp (ISO 8601)")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    created_by: str = Field(description="Creator user UUID")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")
    items: Optional[List[SettlementItemResponse]] = Field(default=None, description="Settlement items")


class SettlementSingleResponse(BaseModel):
    """Single settlement response wrapper."""
    success: bool = True
    data: SettlementResponse
    message: Optional[str] = None


class SettlementCreateResponse(BaseModel):
    """Create settlement response wrapper."""
    success: bool = True
    data: SettlementResponse
    message: str = Field(default="Settlement generated successfully")


class SettlementApproveResponse(BaseModel):
    """Approve settlement response wrapper."""
    success: bool = True
    data: SettlementResponse
    message: str = Field(default="Settlement approved successfully")


class SettlementMarkPaidResponse(BaseModel):
    """Mark settlement as paid response wrapper."""
    success: bool = True
    data: SettlementResponse
    message: str = Field(default="Settlement marked as paid successfully")


class SettlementListResponse(BaseModel):
    """Settlement list response with pagination."""
    success: bool = True
    data: List[SettlementResponse]
    pagination: PaginationMeta
