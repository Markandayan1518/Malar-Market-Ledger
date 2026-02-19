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


class FlowerTypeCreate(BaseModel):
    """Flower type creation schema."""
    name: str = Field(..., min_length=2, max_length=255)
    name_ta: Optional[str] = Field(None, max_length=255)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None
    unit: str = Field(default="kg", max_length=20)


class FlowerTypeUpdate(BaseModel):
    """Flower type update schema."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    name_ta: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class FlowerTypeResponse(FlowerTypeBase):
    """Flower type response schema."""
    pass


class FlowerTypeListResponse(PaginatedResponse[FlowerTypeResponse]):
    """Flower type list response schema."""
    pass


# ==================== FARMER PRODUCT SCHEMAS ====================

class FarmerProductBase(BaseModel):
    """Base farmer product schema."""
    id: str
    farmer_id: str
    flower_type_id: str
    entry_count: int
    last_entry_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class FarmerProductCreate(BaseModel):
    """Farmer product creation schema."""
    flower_type_id: str


class FarmerProductBatchCreate(BaseModel):
    """Batch creation schema for farmer products."""
    flower_type_ids: List[str] = Field(..., min_length=1)


class FarmerProductResponse(FarmerProductBase):
    """Farmer product response schema."""
    flower_type: FlowerTypeBase


class FarmerProductListResponse(BaseModel):
    """Farmer product list response schema."""
    farmer_id: str
    products: List[FarmerProductResponse]


class SuggestedFlowerResponse(BaseModel):
    """Suggested flower response for smart suggestions."""
    flower_type: FlowerTypeBase
    entry_count: int
    last_entry_at: Optional[datetime] = None
    is_primary: bool  # True if this is the most common flower for this farmer


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


# ==================== BUSINESS PROFILE SCHEMAS ====================

class BusinessProfileBase(BaseModel):
    """Base business profile schema."""
    id: str
    shop_name: str
    owner_name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    phone: str
    alternate_phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    upi_id: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: str
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BusinessProfileCreate(BaseModel):
    """Business profile creation schema."""
    shop_name: str = Field(..., min_length=2, max_length=255)
    owner_name: str = Field(..., min_length=2, max_length=255)
    address_line1: str = Field(..., min_length=5)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    pincode: str = Field(..., min_length=6, max_length=20)
    phone: str = Field(..., min_length=10, max_length=20)
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    upi_id: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: str = Field(default="INV", max_length=10)
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None


class BusinessProfileUpdate(BaseModel):
    """Business profile update schema."""
    shop_name: Optional[str] = Field(None, min_length=2, max_length=255)
    owner_name: Optional[str] = Field(None, min_length=2, max_length=255)
    address_line1: Optional[str] = Field(None, min_length=5)
    address_line2: Optional[str] = None
    city: Optional[str] = Field(None, min_length=2)
    state: Optional[str] = Field(None, min_length=2)
    pincode: Optional[str] = Field(None, min_length=6, max_length=20)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    upi_id: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: Optional[str] = Field(None, max_length=10)
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None
    is_active: Optional[bool] = None


class BusinessProfileResponse(BusinessProfileBase):
    """Business profile response schema."""
    pass


# ==================== INVOICE SCHEMAS ====================

from app.models.invoice import InvoiceStatus


class InvoiceItemBase(BaseModel):
    """Base invoice item schema."""
    id: str
    description: str
    quantity: Decimal
    unit: str
    rate: Decimal
    total: Decimal
    flower_type_id: Optional[str] = None
    sort_order: int


class InvoiceItemCreate(BaseModel):
    """Invoice item creation schema."""
    description: str = Field(..., min_length=2, max_length=500)
    quantity: Decimal = Field(..., gt=0)
    unit: str = Field(default="kg", max_length=20)
    rate: Decimal = Field(..., gt=0)
    daily_entry_id: Optional[str] = None
    flower_type_id: Optional[str] = None
    sort_order: int = Field(default=0)


class InvoiceItemResponse(InvoiceItemBase):
    """Invoice item response schema."""
    pass


class InvoiceBase(BaseModel):
    """Base invoice schema."""
    id: str
    invoice_number: str
    farmer_id: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    status: InvoiceStatus
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    notes: Optional[str] = None
    terms: Optional[str] = None
    settlement_id: Optional[str] = None
    created_by: str
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InvoiceCreate(BaseModel):
    """Invoice creation schema."""
    farmer_id: Optional[str] = None
    customer_name: str = Field(..., min_length=2, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_address: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    tax_rate: Decimal = Field(default=0, ge=0, le=100)
    discount: Decimal = Field(default=0, ge=0)
    notes: Optional[str] = None
    terms: Optional[str] = None
    settlement_id: Optional[str] = None
    items: List[InvoiceItemCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseModel):
    """Invoice update schema."""
    customer_name: Optional[str] = Field(None, min_length=2, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_address: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    discount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceResponse(InvoiceBase):
    """Invoice response schema."""
    items: List[InvoiceItemResponse] = []


class InvoiceListResponse(PaginatedResponse[InvoiceResponse]):
    """Invoice list response schema."""
    pass


class InvoicePaymentRequest(BaseModel):
    """Invoice payment request schema."""
    amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class InvoiceCancelRequest(BaseModel):
    """Invoice cancel request schema."""
    reason: str = Field(..., min_length=5)
