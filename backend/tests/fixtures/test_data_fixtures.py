"""
Test data fixtures for API testing.

This module provides pytest fixtures for test data generation
using Pydantic models for type safety.
"""

import pytest
from decimal import Decimal
from typing import Dict, Any
import uuid

from tests.schemas.farmers import FarmerCreate
from tests.schemas.flower_types import FlowerTypeCreate
from tests.schemas.time_slots import TimeSlotResponse
from tests.schemas.market_rates import MarketRateCreate
from tests.schemas.daily_entries import DailyEntryCreate, AdjustmentReasonCode
from tests.schemas.cash_advances import CashAdvanceCreate
from tests.schemas.settlements import SettlementCreateRequest


@pytest.fixture
def test_farmer_data() -> Dict[str, Any]:
    """
    Generate test farmer data.
    
    Returns:
        Dictionary with farmer creation data
    """
    unique_id = str(uuid.uuid4())[:8]
    return {
        "farmer_code": f"TEST{unique_id}",
        "name": "Test Farmer",
        "village": "Test Village",
        "phone": f"+9198765{unique_id[:5]}",
        "whatsapp_number": f"+9198765{unique_id[:5]}",
        "address": "123, Test Street, Test Village",
        "commission_pct": Decimal("10.00"),
        "flat_fee_monthly": Decimal("0.00"),
    }


@pytest.fixture
def test_farmer_create(test_farmer_data: Dict[str, Any]) -> FarmerCreate:
    """
    Get Pydantic model for farmer creation.
    
    Args:
        test_farmer_data: Farmer data dictionary
        
    Returns:
        FarmerCreate Pydantic model
    """
    return FarmerCreate(**test_farmer_data)


@pytest.fixture
def test_flower_type_data() -> Dict[str, Any]:
    """
    Generate test flower type data.
    
    Returns:
        Dictionary with flower type creation data
    """
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"Test Flower {unique_id}",
        "name_ta": f"சோதனை மலர் {unique_id}",
        "code": f"TFL{unique_id[:5]}",
        "description": "Test flower type for API testing",
        "unit": "kg",
    }


@pytest.fixture
def test_flower_type_create(test_flower_type_data: Dict[str, Any]) -> FlowerTypeCreate:
    """
    Get Pydantic model for flower type creation.
    
    Args:
        test_flower_type_data: Flower type data dictionary
        
    Returns:
        FlowerTypeCreate Pydantic model
    """
    return FlowerTypeCreate(**test_flower_type_data)


@pytest.fixture
def test_time_slot_data() -> Dict[str, Any]:
    """
    Generate test time slot data.
    
    Returns:
        Dictionary with time slot creation data
    """
    return {
        "name": "Test Morning Slot",
        "name_ta": "சோதனை காலை இடைவெளி",
        "start_time": "04:00:00",
        "end_time": "06:00:00",
    }


@pytest.fixture
def test_market_rate_data() -> Dict[str, Any]:
    """
    Generate test market rate data.
    
    Returns:
        Dictionary with market rate creation data
    """
    return {
        "flower_type_id": "placeholder-flower-type-id",
        "time_slot_id": "placeholder-time-slot-id",
        "rate_per_unit": Decimal("150.00"),
        "effective_date": "2026-02-14",
    }


@pytest.fixture
def test_market_rate_create(test_market_rate_data: Dict[str, Any]) -> MarketRateCreate:
    """
    Get Pydantic model for market rate creation.
    
    Args:
        test_market_rate_data: Market rate data dictionary
        
    Returns:
        MarketRateCreate Pydantic model
    """
    return MarketRateCreate(**test_market_rate_data)


@pytest.fixture
def test_daily_entry_data() -> Dict[str, Any]:
    """
    Generate test daily entry data.
    
    Returns:
        Dictionary with daily entry creation data
    """
    return {
        "farmer_id": "placeholder-farmer-id",
        "flower_type_id": "placeholder-flower-type-id",
        "entry_date": "2026-02-14",
        "entry_time": "05:30:00",
        "quantity": Decimal("10.50"),
        "notes": "Test daily entry for API testing",
        "manual_adj_amount": Decimal("0.00"),
        "adj_reason_code": None,
    }


@pytest.fixture
def test_daily_entry_create(test_daily_entry_data: Dict[str, Any]) -> DailyEntryCreate:
    """
    Get Pydantic model for daily entry creation.
    
    Args:
        test_daily_entry_data: Daily entry data dictionary
        
    Returns:
        DailyEntryCreate Pydantic model
    """
    return DailyEntryCreate(**test_daily_entry_data)


@pytest.fixture
def test_daily_entry_with_adjustment() -> Dict[str, Any]:
    """
    Generate test daily entry data with adjustment.
    
    Returns:
        Dictionary with daily entry creation data including adjustment
    """
    return {
        "farmer_id": "placeholder-farmer-id",
        "flower_type_id": "placeholder-flower-type-id",
        "entry_date": "2026-02-14",
        "entry_time": "05:30:00",
        "quantity": Decimal("10.50"),
        "notes": "Test daily entry with adjustment",
        "manual_adj_amount": Decimal("-50.00"),
        "adj_reason_code": AdjustmentReasonCode.WET,
    }


@pytest.fixture
def test_cash_advance_data() -> Dict[str, Any]:
    """
    Generate test cash advance data.
    
    Returns:
        Dictionary with cash advance creation data
    """
    return {
        "farmer_id": "placeholder-farmer-id",
        "amount": Decimal("5000.00"),
        "reason": "Test emergency medical expense",
        "advance_date": "2026-02-14",
        "notes": "Test cash advance for API testing",
    }


@pytest.fixture
def test_cash_advance_create(test_cash_advance_data: Dict[str, Any]) -> CashAdvanceCreate:
    """
    Get Pydantic model for cash advance creation.
    
    Args:
        test_cash_advance_data: Cash advance data dictionary
        
    Returns:
        CashAdvanceCreate Pydantic model
    """
    return CashAdvanceCreate(**test_cash_advance_data)


@pytest.fixture
def test_settlement_data() -> Dict[str, Any]:
    """
    Generate test settlement data.
    
    Returns:
        Dictionary with settlement creation data
    """
    return {
        "farmer_id": "placeholder-farmer-id",
        "period_start": "2026-02-01",
        "period_end": "2026-02-14",
        "notes": "Test settlement for API testing",
    }


@pytest.fixture
def test_settlement_create(test_settlement_data: Dict[str, Any]) -> SettlementCreateRequest:
    """
    Get Pydantic model for settlement creation.
    
    Args:
        test_settlement_data: Settlement data dictionary
        
    Returns:
        SettlementCreateRequest Pydantic model
    """
    return SettlementCreateRequest(**test_settlement_data)


# Helper fixtures for creating related test data
@pytest.fixture
def sample_uuid() -> str:
    """
    Generate a sample UUID string.
    
    Returns:
        UUID string
    """
    return str(uuid.uuid4())


@pytest.fixture
def today_date() -> str:
    """
    Get today's date in ISO format.
    
    Returns:
        Date string (YYYY-MM-DD)
    """
    from datetime import date
    return date.today().isoformat()


@pytest.fixture
def now_time() -> str:
    """
    Get current time in HH:MM:SS format.
    
    Returns:
        Time string (HH:MM:SS)
    """
    from datetime import datetime
    return datetime.now().strftime("%H:%M:%S")
