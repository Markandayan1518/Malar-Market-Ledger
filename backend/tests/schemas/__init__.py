"""
Pydantic schemas for API contract testing.

This module provides type-safe models for validating API request and response payloads.
"""

from tests.schemas.common import (
    PaginationMeta,
    SuccessResponse,
    ErrorDetail,
    ErrorBody,
    ErrorResponse,
    PaginatedResponse,
)
from tests.schemas.auth import (
    UserRole,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserInToken,
    LoginResponse,
    RefreshTokenResponse,
    LogoutResponse,
)
from tests.schemas.users import (
    UserResponse,
    UserCreate,
    UserUpdate,
)
from tests.schemas.farmers import (
    FarmerResponse,
    FarmerCreate,
    FarmerUpdate,
    FarmerBalance,
    NestedFarmer,
    FarmerListResponse,
)
from tests.schemas.flower_types import (
    FlowerTypeResponse,
    FlowerTypeCreate,
    FlowerTypeUpdate,
    NestedFlowerType,
)
from tests.schemas.time_slots import (
    TimeSlotResponse,
    NestedTimeSlot,
)
from tests.schemas.market_rates import (
    MarketRateResponse,
    MarketRateCreate,
    CurrentRateResponse,
    MarketRateListResponse,
)
from tests.schemas.daily_entries import (
    AdjustmentReasonCode,
    DailyEntryCreate,
    DailyEntryUpdate,
    DailyEntryResponse,
    DailyEntryListResponse,
)
from tests.schemas.cash_advances import (
    AdvanceStatus,
    CashAdvanceCreate,
    CashAdvanceUpdate,
    CashAdvanceResponse,
    CashAdvanceApproveRequest,
    CashAdvanceListResponse,
)
from tests.schemas.settlements import (
    SettlementStatus,
    SettlementItemResponse,
    SettlementCreateRequest,
    SettlementResponse,
    SettlementApproveRequest,
    SettlementListResponse,
)
from tests.schemas.reports import (
    FlowerTypeBreakdown,
    DailySummaryResponse,
    FarmerSummaryResponse,
)
from tests.schemas.notifications import (
    NotificationStatus,
    NotificationChannel,
    NotificationResponse,
    NotificationListResponse,
)

__all__ = [
    # Common
    "PaginationMeta",
    "SuccessResponse",
    "ErrorDetail",
    "ErrorBody",
    "ErrorResponse",
    "PaginatedResponse",
    # Auth
    "UserRole",
    "LoginRequest",
    "RefreshTokenRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UserInToken",
    "LoginResponse",
    "RefreshTokenResponse",
    "LogoutResponse",
    # Users
    "UserResponse",
    "UserCreate",
    "UserUpdate",
    # Farmers
    "FarmerResponse",
    "FarmerCreate",
    "FarmerUpdate",
    "FarmerBalance",
    "NestedFarmer",
    "FarmerListResponse",
    # Flower Types
    "FlowerTypeResponse",
    "FlowerTypeCreate",
    "FlowerTypeUpdate",
    "NestedFlowerType",
    # Time Slots
    "TimeSlotResponse",
    "NestedTimeSlot",
    # Market Rates
    "MarketRateResponse",
    "MarketRateCreate",
    "CurrentRateResponse",
    "MarketRateListResponse",
    # Daily Entries
    "AdjustmentReasonCode",
    "DailyEntryCreate",
    "DailyEntryUpdate",
    "DailyEntryResponse",
    "DailyEntryListResponse",
    # Cash Advances
    "AdvanceStatus",
    "CashAdvanceCreate",
    "CashAdvanceUpdate",
    "CashAdvanceResponse",
    "CashAdvanceApproveRequest",
    "CashAdvanceListResponse",
    # Settlements
    "SettlementStatus",
    "SettlementItemResponse",
    "SettlementCreateRequest",
    "SettlementResponse",
    "SettlementApproveRequest",
    "SettlementListResponse",
    # Reports
    "FlowerTypeBreakdown",
    "DailySummaryResponse",
    "FarmerSummaryResponse",
    # Notifications
    "NotificationStatus",
    "NotificationChannel",
    "NotificationResponse",
    "NotificationListResponse",
]
