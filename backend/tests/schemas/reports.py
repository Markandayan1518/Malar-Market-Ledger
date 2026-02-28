"""
Pydantic schemas for Reports API endpoints.

Based on docs/api-design.md Reports Module section.
"""

from typing import List
from decimal import Decimal
from pydantic import BaseModel, Field

from tests.schemas.farmers import NestedFarmer


class FlowerTypeBreakdown(BaseModel):
    """Flower type breakdown in daily summary."""
    flower_type: str = Field(description="Flower type name")
    total_quantity: Decimal = Field(description="Total quantity")
    total_amount: Decimal = Field(description="Total amount")


class DailySummaryResponseData(BaseModel):
    """Daily summary report data structure."""
    date: str = Field(description="Report date (YYYY-MM-DD)")
    total_entries: int = Field(description="Total number of entries")
    total_quantity: Decimal = Field(description="Total quantity")
    gross_amount: Decimal = Field(description="Gross amount")
    total_commission: Decimal = Field(description="Total commission")
    net_amount: Decimal = Field(description="Net amount")
    unique_farmers: int = Field(description="Number of unique farmers")
    flower_type_breakdown: List[FlowerTypeBreakdown] = Field(
        default_factory=list,
        description="Breakdown by flower type"
    )


class DailySummaryResponse(BaseModel):
    """Daily summary report response wrapper."""
    success: bool = True
    data: DailySummaryResponseData


class FarmerSummaryResponseData(BaseModel):
    """Farmer summary report data structure."""
    farmer_id: str = Field(description="Farmer UUID")
    farmer: NestedFarmer = Field(description="Farmer details")
    period_start: str = Field(description="Period start date (YYYY-MM-DD)")
    period_end: str = Field(description="Period end date (YYYY-MM-DD)")
    total_entries: int = Field(description="Total number of entries")
    total_quantity: Decimal = Field(description="Total quantity")
    gross_amount: Decimal = Field(description="Gross amount")
    total_commission: Decimal = Field(description="Total commission")
    net_amount: Decimal = Field(description="Net amount")
    advances_taken: Decimal = Field(description="Total advances taken")
    settlements_received: Decimal = Field(description="Total settlements received")
    current_balance: Decimal = Field(description="Current balance")


class FarmerSummaryResponse(BaseModel):
    """Farmer summary report response wrapper."""
    success: bool = True
    data: FarmerSummaryResponseData
