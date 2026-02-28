"""
Pytest fixtures for API testing.

This module provides fixtures for authentication, test data, and API client setup.
"""

from tests.fixtures.auth_fixtures import (
    api_client,
    admin_client,
    staff_client,
    admin_auth_headers,
    staff_auth_headers,
    admin_tokens,
    staff_tokens,
)
from tests.fixtures.test_data_fixtures import (
    test_farmer_data,
    test_flower_type_data,
    test_time_slot_data,
    test_market_rate_data,
    test_daily_entry_data,
    test_cash_advance_data,
    test_settlement_data,
)

__all__ = [
    # Auth fixtures
    "api_client",
    "admin_client",
    "staff_client",
    "admin_auth_headers",
    "staff_auth_headers",
    "admin_tokens",
    "staff_tokens",
    # Test data fixtures
    "test_farmer_data",
    "test_flower_type_data",
    "test_time_slot_data",
    "test_market_rate_data",
    "test_daily_entry_data",
    "test_cash_advance_data",
    "test_settlement_data",
]
