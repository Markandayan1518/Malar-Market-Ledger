"""
Tests for Market Rates Endpoints

This module contains tests for the /api/v1/market-rates endpoints including:
- GET /market-rates - List all market rates
- GET /market-rates/current - Get current applicable rate
- POST /market-rates - Create new market rate

Uses Pydantic schemas for request serialization and response validation.
"""

import pytest
import os
from datetime import date, datetime
from decimal import Decimal

from tests.utils.api_client import APIClient, AuthenticationError
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_error_response,
    validate_paginated_response,
)
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
    ERROR_VALIDATION,
    ERROR_RESOURCE_NOT_FOUND,
    ERROR_PERMISSION_DENIED,
)
from tests.schemas.market_rates import (
    MarketRateResponse,
    MarketRateCreate,
    CurrentRateResponse,
    NestedFlowerTypeInRate,
    NestedTimeSlotInRate,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestMarketRatesList:
    """Tests for GET /api/v1/market-rates"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_market_rates_returns_200(self, admin_client: APIClient):
        """Test GET /market-rates returns 200 with paginated rate list"""
        response = admin_client.get("/market-rates")
        
        assert_status_code(response, HTTP_200_OK)
        
        # Validate paginated response structure
        data = validate_paginated_response(response)
        
        # Validate pagination metadata
        assert "pagination" in data
        pagination = data["pagination"]
        assert "page" in pagination
        assert "page_size" in pagination
        assert "total_items" in pagination

    @pytest.mark.positive
    def test_list_market_rates_with_pagination(self, admin_client: APIClient):
        """Test GET /market-rates with pagination parameters"""
        response = admin_client.get("/market-rates", params={"page": 1, "page_size": 10})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10

    @pytest.mark.positive
    def test_list_market_rates_with_flower_type_filter(self, admin_client: APIClient):
        """Test GET /market-rates with flower_type_id filter"""
        # First get list of flower types
        flower_response = admin_client.get("/flower-types", params={"page_size": 1})
        
        if flower_response.status_code != 200:
            pytest.skip("Could not fetch flower types")
        
        flower_data = flower_response.json()
        flower_types = flower_data.get("data", [])
        
        if not flower_types:
            pytest.skip("No flower types available for testing")
        
        flower_type_id = flower_types[0]["id"]
        
        # Filter by flower type
        response = admin_client.get("/market-rates", params={"flower_type_id": flower_type_id})
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_market_rates_with_date_filter(self, admin_client: APIClient):
        """Test GET /market-rates with effective_date filter"""
        today = date.today().isoformat()
        
        response = admin_client.get("/market-rates", params={"effective_date": today})
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_market_rates_staff_access(self, staff_client: APIClient):
        """Test GET /market-rates returns 200 for staff users"""
        response = staff_client.get("/market-rates")
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_market_rates_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /market-rates returns 401 without authentication"""
        response = api_client_v2.get("/market-rates")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestMarketRatesCurrent:
    """Tests for GET /api/v1/market-rates/current"""

    # ==================== HELPER METHODS ====================

    def _get_test_flower_type_id(self, client: APIClient) -> str:
        """Get a valid flower type ID for testing"""
        response = client.get("/flower-types", params={"page_size": 1})
        if response.status_code == 200:
            data = response.json()
            flower_types = data.get("data", [])
            if flower_types:
                return flower_types[0]["id"]
        return None

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_current_rate_returns_200(self, admin_client: APIClient):
        """Test GET /market-rates/current returns 200 with valid parameters"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not flower_type_id:
            pytest.skip("No flower types available for testing")
        
        response = admin_client.get("/market-rates/current", params={
            "flower_type_id": flower_type_id,
            "entry_time": "05:30:00"
        })
        
        # May return 404 if no rate configured, which is acceptable
        if response.status_code == HTTP_404_NOT_FOUND:
            pytest.skip("No market rate configured for this flower type/time")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate current rate response schema
        current_rate = CurrentRateResponse.model_validate(data["data"])
        assert current_rate.flower_type_id == flower_type_id
        assert current_rate.rate_per_unit is not None

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_current_rate_missing_flower_type_returns_422(self, admin_client: APIClient):
        """Test GET /market-rates/current returns 422 without flower_type_id"""
        response = admin_client.get("/market-rates/current", params={
            "entry_time": "05:30:00"
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_get_current_rate_missing_time_returns_422(self, admin_client: APIClient):
        """Test GET /market-rates/current returns 422 without entry_time"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not flower_type_id:
            pytest.skip("No flower types available for testing")
        
        response = admin_client.get("/market-rates/current", params={
            "flower_type_id": flower_type_id
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_get_current_rate_invalid_flower_type_returns_404(self, admin_client: APIClient):
        """Test GET /market-rates/current returns 404 with invalid flower_type_id"""
        response = admin_client.get("/market-rates/current", params={
            "flower_type_id": "00000000-0000-0000-0000-000000000000",
            "entry_time": "05:30:00"
        })
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_current_rate_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /market-rates/current returns 401 without authentication"""
        response = api_client_v2.get("/market-rates/current", params={
            "flower_type_id": "00000000-0000-0000-0000-000000000001",
            "entry_time": "05:30:00"
        })
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestMarketRatesCreate:
    """Tests for POST /api/v1/market-rates"""

    # ==================== HELPER METHODS ====================

    def _get_test_flower_type_id(self, client: APIClient) -> str:
        """Get a valid flower type ID for testing"""
        response = client.get("/flower-types", params={"page_size": 1})
        if response.status_code == 200:
            data = response.json()
            flower_types = data.get("data", [])
            if flower_types:
                return flower_types[0]["id"]
        return None

    def _get_test_time_slot_id(self, client: APIClient) -> str:
        """Get a valid time slot ID for testing"""
        response = client.get("/time-slots", params={"page_size": 1})
        if response.status_code == 200:
            data = response.json()
            time_slots = data.get("data", [])
            if time_slots:
                return time_slots[0]["id"]
        return None

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_create_market_rate_returns_200(self, admin_client: APIClient):
        """Test POST /market-rates returns 200 with valid data"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        time_slot_id = self._get_test_time_slot_id(admin_client)
        
        if not flower_type_id or not time_slot_id:
            pytest.skip("Could not get required test data (flower type/time slot)")
        
        rate_data = MarketRateCreate(
            flower_type_id=flower_type_id,
            time_slot_id=time_slot_id,
            rate_per_unit=Decimal("150.00"),
            effective_date=date.today().isoformat()
        )
        
        response = admin_client.post("/market-rates", data=rate_data)
        
        # Accept 201 or 200 as valid creation responses
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = validate_success_response(response)
        
        # Validate created rate
        created_rate = MarketRateResponse.model_validate(data["data"])
        assert created_rate.flower_type_id == flower_type_id
        assert created_rate.time_slot_id == time_slot_id
        assert float(created_rate.rate_per_unit) == 150.00

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_market_rate_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /market-rates returns 422 with missing required fields"""
        response = admin_client.post("/market-rates", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_market_rate_invalid_flower_type_returns_404(self, admin_client: APIClient):
        """Test POST /market-rates returns 404 with invalid flower_type_id"""
        time_slot_id = self._get_test_time_slot_id(admin_client)
        
        if not time_slot_id:
            pytest.skip("Could not get time slot ID")
        
        rate_data = MarketRateCreate(
            flower_type_id="00000000-0000-0000-0000-000000000000",
            time_slot_id=time_slot_id,
            rate_per_unit=Decimal("150.00"),
            effective_date=date.today().isoformat()
        )
        
        response = admin_client.post("/market-rates", data=rate_data)
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_create_market_rate_negative_rate_returns_422(self, admin_client: APIClient):
        """Test POST /market-rates returns 422 with negative rate"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        time_slot_id = self._get_test_time_slot_id(admin_client)
        
        if not flower_type_id or not time_slot_id:
            pytest.skip("Could not get required test data")
        
        response = admin_client.post("/market-rates", data={
            "flower_type_id": flower_type_id,
            "time_slot_id": time_slot_id,
            "rate_per_unit": -100.00,
            "effective_date": date.today().isoformat()
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_market_rate_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /market-rates returns 403 for staff users"""
        flower_type_id = self._get_test_flower_type_id(staff_client)
        time_slot_id = self._get_test_time_slot_id(staff_client)
        
        if not flower_type_id or not time_slot_id:
            pytest.skip("Could not get required test data")
        
        rate_data = MarketRateCreate(
            flower_type_id=flower_type_id,
            time_slot_id=time_slot_id,
            rate_per_unit=Decimal("150.00"),
            effective_date=date.today().isoformat()
        )
        
        response = staff_client.post("/market-rates", data=rate_data)
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_create_market_rate_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /market-rates returns 401 without authentication"""
        rate_data = MarketRateCreate(
            flower_type_id="00000000-0000-0000-0000-000000000001",
            time_slot_id="00000000-0000-0000-0000-000000000001",
            rate_per_unit=Decimal("150.00"),
            effective_date=date.today().isoformat()
        )
        
        response = api_client_v2.post("/market-rates", data=rate_data)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestMarketRatesResponseSchema:
    """Tests for validating market rate response schemas"""

    @pytest.mark.positive
    def test_market_rate_response_includes_nested_flower_type(self, admin_client: APIClient):
        """Test that market rate response includes nested flower type details"""
        response = admin_client.get("/market-rates", params={"page_size": 1})
        
        if response.status_code != 200:
            pytest.skip("Could not fetch market rates")
        
        data = response.json()
        rates = data.get("data", [])
        
        if not rates:
            pytest.skip("No market rates available for testing")
        
        rate = rates[0]
        
        # Validate nested flower_type structure
        if "flower_type" in rate:
            flower_type = NestedFlowerTypeInRate.model_validate(rate["flower_type"])
            assert flower_type.name is not None

    @pytest.mark.positive
    def test_market_rate_response_includes_nested_time_slot(self, admin_client: APIClient):
        """Test that market rate response includes nested time slot details"""
        response = admin_client.get("/market-rates", params={"page_size": 1})
        
        if response.status_code != 200:
            pytest.skip("Could not fetch market rates")
        
        data = response.json()
        rates = data.get("data", [])
        
        if not rates:
            pytest.skip("No market rates available for testing")
        
        rate = rates[0]
        
        # Validate nested time_slot structure
        if "time_slot" in rate:
            time_slot = NestedTimeSlotInRate.model_validate(rate["time_slot"])
            assert time_slot.name is not None
