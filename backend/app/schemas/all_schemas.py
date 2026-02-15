"""Complete Pydantic schemas for all models."""

from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, field_validator
from decimal import Decimal

from app.models.user import UserRole
from app.models.cash_advance import AdvanceStatus
from app.models.settlement import SettlementStatus
from app.models.notification import NotificationStatus, NotificationChannel

from app.schemas.common import (
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
    create_success_response,
    create_paginated_response
)


# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    """Base user schema."""
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    email_verified: bool
    language_preference: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    """User creation schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.STAFF)
    language_preference: str = Field(default="en", pattern="^(en|ta)$")


class UserUpdate(BaseModel):
    """User update schema."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    language_preference: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    pass


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr = Field(alias="username")
    password: str

    model_config = {"populate_by_name": True}


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class RefreshTokenResponse(BaseModel):
    """Refresh token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


# ==================== FARMER SCHEMAS ====================

class FarmerBase(BaseModel):
    """Base farmer schema."""
    id: str
    farmer_code: str
    name: str
    village: Optional[str] = None
    phone: str
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    current_balance: Decimal
    total_advances: Decimal
    total_settlements: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FarmerCreate(BaseModel):
    """Farmer creation schema."""
    farmer_code: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=2)
    village: Optional[str] = None
    phone: str = Field(..., min_length=10, max_length=20)
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None


class FarmerUpdate(BaseModel):
    """Farmer update schema."""
    name: Optional[str] = None
    village: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None


class FarmerResponse(FarmerBase):
    """Farmer response schema."""
    pass


class FarmerListResponse(PaginatedResponse[FarmerResponse]):
    """Farmer list response schema."""
    pass


# ==================== FLOWER TYPE SCHEMAS ====================

class FlowerTypeBase(BaseModel):
    """Base flower type schema."""
    id: str
    name: str
    name_ta: Optional[str] = None
    code: str
    description: Optional[str] = None
    unit: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FlowerTypeResponse(FlowerTypeBase):
    """Flower type response schema."""
    pass


class FlowerTypeListResponse(PaginatedResponse[FlowerTypeResponse]):
    """Flower type list response schema."""
    pass


# ==================== TIME SLOT SCHEMAS ====================

class TimeSlotBase(BaseModel):
    """Base time slot schema."""
    id: str
    name: str
    name_ta: Optional[str] = None
    start_time: time
    end_time: time
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TimeSlotResponse(TimeSlotBase):
    """Time slot response schema."""
    pass


class TimeSlotListResponse(PaginatedResponse[TimeSlotResponse]):
    """Time slot list response schema."""
    pass


# ==================== MARKET RATE SCHEMAS ====================

class MarketRateBase(BaseModel):
    """Base market rate schema."""
    id: str
    flower_type_id: str
    flower_type: FlowerTypeBase
    time_slot_id: str
    time_slot: TimeSlotBase
    rate_per_unit: Decimal
    effective_date: date
    expiry_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MarketRateCreate(BaseModel):
    """Market rate creation schema."""
    flower_type_id: str
    time_slot_id: str
    rate_per_unit: Decimal = Field(..., gt=0)
    effective_date: date
    expiry_date: Optional[date] = None


class MarketRateResponse(MarketRateBase):
    """Market rate response schema."""
    pass


class MarketRateListResponse(PaginatedResponse[MarketRateResponse]):
    """Market rate list response schema."""
    pass


class CurrentRateResponse(BaseModel):
    """Current rate response schema."""
    flower_type_id: str
    time_slot_id: str
    rate_per_unit: Decimal
    effective_date: date
    time_slot: TimeSlotBase


# ==================== DAILY ENTRY SCHEMAS ====================

class DailyEntryBase(BaseModel):
    """Base daily entry schema."""
    id: str
    farmer_id: str
    farmer: FarmerBase
    flower_type_id: str
    flower_type: FlowerTypeBase
    time_slot_id: str
    time_slot: TimeSlotBase
    entry_date: date
    entry_time: time
    quantity: Decimal
    rate_per_unit: Decimal
    total_amount: Decimal
    commission_rate: Decimal
    commission_amount: Decimal
    net_amount: Decimal
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class DailyEntryCreate(BaseModel):
    """Daily entry creation schema."""
    farmer_id: str
    flower_type_id: str
    entry_date: date
    entry_time: time
    quantity: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class DailyEntryUpdate(BaseModel):
    """Daily entry update schema."""
    quantity: Optional[Decimal] = None
    entry_time: Optional[time] = None
    notes: Optional[str] = None


class DailyEntryResponse(DailyEntryBase):
    """Daily entry response schema."""
    pass


class DailyEntryListResponse(PaginatedResponse[DailyEntryResponse]):
    """Daily entry list response schema."""
    pass


# ==================== CASH ADVANCE SCHEMAS ====================

class CashAdvanceBase(BaseModel):
    """Base cash advance schema."""
    id: str
    farmer_id: str
    farmer: FarmerBase
    amount: Decimal
    reason: str
    advance_date: date
    status: AdvanceStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class CashAdvanceCreate(BaseModel):
    """Cash advance creation schema."""
    farmer_id: str
    amount: Decimal = Field(..., gt=0)
    reason: str = Field(..., min_length=5)
    advance_date: date
    notes: Optional[str] = None


class CashAdvanceUpdate(BaseModel):
    """Cash advance update schema."""
    notes: Optional[str] = None


class CashAdvanceResponse(CashAdvanceBase):
    """Cash advance response schema."""
    pass


class CashAdvanceListResponse(PaginatedResponse[CashAdvanceResponse]):
    """Cash advance list response schema."""
    pass


class CashAdvanceApproveRequest(BaseModel):
    """Cash advance approval request schema."""
    notes: Optional[str] = None


# ==================== SETTLEMENT SCHEMAS ====================

class SettlementItemBase(BaseModel):
    """Base settlement item schema."""
    id: str
    daily_entry_id: str
    entry_date: date
    flower_type: str
    quantity: Decimal
    rate_per_unit: Decimal
    total_amount: Decimal
    commission_amount: Decimal
    net_amount: Decimal


class SettlementBase(BaseModel):
    """Base settlement schema."""
    id: str
    farmer_id: str
    farmer: FarmerBase
    settlement_date: date
    settlement_number: str
    period_start: date
    period_end: date
    total_entries: int
    total_quantity: Decimal
    gross_amount: Decimal
    total_commission: Decimal
    total_fees: Decimal
    total_advances: Decimal
    net_payable: Decimal
    status: SettlementStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class SettlementCreateRequest(BaseModel):
    """Settlement creation request schema."""
    farmer_id: str
    period_start: date
    period_end: date
    notes: Optional[str] = None


class SettlementResponse(SettlementBase):
    """Settlement response schema."""
    items: Optional[List[SettlementItemBase]] = None


class SettlementListResponse(PaginatedResponse[SettlementResponse]):
    """Settlement list response schema."""
    pass


class SettlementApproveRequest(BaseModel):
    """Settlement approve request schema."""
    notes: Optional[str] = None


# ==================== NOTIFICATION SCHEMAS ====================

class NotificationBase(BaseModel):
    """Base notification schema."""
    id: str
    user_id: Optional[str] = None
    farmer_id: Optional[str] = None
    type: str
    channel: NotificationChannel
    status: NotificationStatus
    title: str
    title_ta: Optional[str] = None
    message: str
    message_ta: Optional[str] = None
    template_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime


class NotificationResponse(NotificationBase):
    """Notification response schema."""
    pass


class NotificationListResponse(PaginatedResponse[NotificationResponse]):
    """Notification list response schema."""
    pass


# ==================== SYSTEM SETTING SCHEMAS ====================

class SystemSettingBase(BaseModel):
    """Base system setting schema."""
    key: str
    value: str
    value_type: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: datetime


class SystemSettingUpdate(BaseModel):
    """System setting update schema."""
    value: str


class SystemSettingResponse(SystemSettingBase):
    """System setting response schema."""
    pass


class SystemSettingListResponse(PaginatedResponse[SystemSettingResponse]):
    """System setting list response schema."""
    pass


# ==================== REPORT SCHEMAS ====================

class DailySummaryResponse(BaseModel):
    """Daily summary response schema."""
    date: date
    total_entries: int
    total_quantity: Decimal
    gross_amount: Decimal
    total_commission: Decimal
    net_amount: Decimal
    unique_farmers: int
    flower_type_breakdown: List[dict]


class FarmerSummaryResponse(BaseModel):
    """Farmer summary response schema."""
    farmer_id: str
    farmer: FarmerBase
    period_start: date
    period_end: date
    total_entries: int
    total_quantity: Decimal
    gross_amount: Decimal
    total_commission: Decimal
    net_amount: Decimal
    advances_taken: Decimal
    settlements_received: Decimal
    current_balance: Decimal
    last_updated: datetime
