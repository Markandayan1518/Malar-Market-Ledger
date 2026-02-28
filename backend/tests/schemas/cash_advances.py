"""
Pydantic schemas for Cash Advances API endpoints.

Based on docs/api-design.md Cash Advances Module section.
"""

from typing import Optional, List
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta
from tests.schemas.farmers import NestedFarmer


class AdvanceStatus(str, Enum):
    """Cash advance status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CashAdvanceCreate(BaseModel):
    """Create cash advance request payload."""
    farmer_id: str = Field(description="Farmer UUID")
    amount: Decimal = Field(gt=0, description="Advance amount")
    reason: str = Field(description="Reason for advance")
    advance_date: str = Field(description="Advance date (YYYY-MM-DD)")
    notes: Optional[str] = Field(default=None, description="Optional notes")


class CashAdvanceUpdate(BaseModel):
    """Update cash advance request payload (for approval/rejection notes)."""
    notes: Optional[str] = Field(default=None, description="Optional notes")


class CashAdvanceApproveRequest(BaseModel):
    """Approve cash advance request payload."""
    notes: Optional[str] = Field(default=None, description="Optional notes")


# Aliases for test imports
CashAdvanceApprove = CashAdvanceApproveRequest
CashAdvanceReject = CashAdvanceUpdate


class NestedFarmerInAdvance(BaseModel):
    """Nested farmer details in cash advance response."""
    farmer_code: str = Field(description="Farmer code")
    name: str = Field(description="Farmer name")


class CashAdvanceResponse(BaseModel):
    """Cash advance response data structure."""
    id: str = Field(description="Cash advance UUID")
    farmer_id: str = Field(description="Farmer UUID")
    farmer: NestedFarmer = Field(description="Farmer details")
    amount: Decimal = Field(description="Advance amount")
    reason: str = Field(description="Reason for advance")
    advance_date: str = Field(description="Advance date (YYYY-MM-DD)")
    status: AdvanceStatus = Field(description="Advance status")
    approved_by: Optional[str] = Field(default=None, description="Approver user UUID")
    approved_at: Optional[str] = Field(default=None, description="Approval timestamp (ISO 8601)")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    created_by: str = Field(description="Creator user UUID")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class CashAdvanceSingleResponse(BaseModel):
    """Single cash advance response wrapper."""
    success: bool = True
    data: CashAdvanceResponse
    message: Optional[str] = None


class CashAdvanceCreateResponse(BaseModel):
    """Create cash advance response wrapper."""
    success: bool = True
    data: CashAdvanceResponse
    message: str = Field(default="Cash advance request created successfully")


class CashAdvanceApproveResponse(BaseModel):
    """Approve cash advance response wrapper."""
    success: bool = True
    data: CashAdvanceResponse
    message: str = Field(default="Cash advance approved successfully")


class CashAdvanceRejectResponse(BaseModel):
    """Reject cash advance response wrapper."""
    success: bool = True
    data: CashAdvanceResponse
    message: str = Field(default="Cash advance rejected successfully")


class CashAdvanceListResponse(BaseModel):
    """Cash advance list response with pagination."""
    success: bool = True
    data: List[CashAdvanceResponse]
    pagination: PaginationMeta
