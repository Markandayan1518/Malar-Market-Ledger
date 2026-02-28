"""
Tests for Daily Entries Endpoints

This module contains tests for the /api/v1/daily-entries endpoints including:
- GET /daily-entries - List all daily entries
- GET /daily-entries/{entry_id} - Get daily entry by ID
- POST /daily-entries - Create new daily entry
- PUT /daily-entries/{entry_id} - Update daily entry
- DELETE /daily-entries/{entry_id} - Delete daily entry

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
    ERROR_NO_APPLICABLE_RATE,
)
from tests.schemas.daily_entries import (
    DailyEntryResponse,
    DailyEntryCreate,
    DailyEntryUpdate,
    AdjustmentReasonCode,
    NestedFarmer,
    NestedFlowerType,
    NestedTimeSlot,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestDailyEntriesList:
    """Tests for GET /api/v1/daily-entries"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_daily_entries_returns_200(self, admin_client: APIClient):
        """Test GET /daily-entries returns 200 with paginated entry list"""
        response = admin_client.get("/daily-entries")
        
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
    def test_list_daily_entries_with_pagination(self, admin_client: APIClient):
        """Test GET /daily-entries with pagination parameters"""
        response = admin_client.get("/daily-entries", params={"page": 1, "page_size": 10})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10

    @pytest.mark.positive
    def test_list_daily_entries_with_farmer_filter(self, admin_client: APIClient):
        """Test GET /daily-entries with farmer_id filter"""
        # First get list of farmers
        farmers_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if farmers_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        farmers_data = farmers_response.json()
        farmers = farmers_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        # Filter by farmer
        response = admin_client.get("/daily-entries", params={"farmer_id": farmer_id})
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_daily_entries_with_date_filter(self, admin_client: APIClient):
        """Test GET /daily-entries with date filters"""
        today = date.today().isoformat()
        
        response = admin_client.get("/daily-entries", params={
            "date_from": today,
            "date_to": today
        })
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_daily_entries_staff_access(self, staff_client: APIClient):
        """Test GET /daily-entries returns 200 for staff users"""
        response = staff_client.get("/daily-entries")
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_daily_entries_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /daily-entries returns 401 without authentication"""
        response = api_client_v2.get("/daily-entries")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailyEntriesGet:
    """Tests for GET /api/v1/daily-entries/{entry_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_daily_entry_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /daily-entries/{id} returns 200 with entry details"""
        # First get list of entries to find a valid ID
        list_response = admin_client.get("/daily-entries", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch daily entries list")
        
        list_data = list_response.json()
        entries = list_data.get("data", [])
        
        if not entries:
            pytest.skip("No daily entries available for testing")
        
        entry_id = entries[0]["id"]
        
        # Get specific entry
        response = admin_client.get(f"/daily-entries/{entry_id}")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate entry response schema
        entry = DailyEntryResponse.model_validate(data["data"])
        assert entry.id == entry_id

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_daily_entry_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /daily-entries/{id} returns 404 with invalid ID"""
        response = admin_client.get("/daily-entries/00000000-0000-0000-0000-000000000000")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_daily_entry_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /daily-entries/{id} returns 401 without authentication"""
        response = api_client_v2.get("/daily-entries/00000000-0000-0000-0000-000000000001")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailyEntriesCreate:
    """Tests for POST /api/v1/daily-entries"""

    # ==================== HELPER METHODS ====================

    def _get_test_farmer_id(self, client: APIClient) -> str:
        """Get a valid farmer ID for testing"""
        response = client.get("/farmers", params={"page_size": 1})
        if response.status_code == 200:
            data = response.json()
            farmers = data.get("data", [])
            if farmers:
                return farmers[0]["id"]
        return None

    def _get_test_flower_type_id(self, client: APIClient) -> str:
        """Get a valid flower type ID for testing"""
        response = client.get("/flower-types", params={"page_size": 1})
        if response.status_code == 200:
            data = response.json()
            # Handle both paginated and non-paginated responses
            flower_types = data.get("data", [])
            if flower_types:
                return flower_types[0]["id"]
        return None

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_create_daily_entry_returns_200(self, admin_client: APIClient):
        """Test POST /daily-entries returns 200 with valid data"""
        farmer_id = self._get_test_farmer_id(admin_client)
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required test data (farmer/flower type)")
        
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.50"),
            notes="Test entry"
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        # Accept 201 or 200 as valid creation responses
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = validate_success_response(response)
        
        # Validate created entry
        created_entry = DailyEntryResponse.model_validate(data["data"])
        assert created_entry.farmer_id == farmer_id
        assert created_entry.flower_type_id == flower_type_id
        assert float(created_entry.quantity) == 10.50
        
        # Cleanup - delete the created entry
        if created_entry.id:
            admin_client.delete(f"/daily-entries/{created_entry.id}")

    @pytest.mark.positive
    def test_create_daily_entry_with_adjustment(self, admin_client: APIClient):
        """Test POST /daily-entries with manual adjustment"""
        farmer_id = self._get_test_farmer_id(admin_client)
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required test data")
        
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00"),
            manual_adj_amount=Decimal("-50.00"),
            adj_reason_code=AdjustmentReasonCode.WET,
            notes="Wet flowers discount"
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED]
        data = validate_success_response(response)
        
        created_entry = DailyEntryResponse.model_validate(data["data"])
        assert float(created_entry.manual_adj_amount) == -50.00
        assert created_entry.adj_reason_code == AdjustmentReasonCode.WET
        
        # Cleanup
        if created_entry.id:
            admin_client.delete(f"/daily-entries/{created_entry.id}")

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_daily_entry_missing_farmer_returns_422(self, admin_client: APIClient):
        """Test POST /daily-entries returns 422 with missing farmer_id"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not flower_type_id:
            pytest.skip("Could not get flower type ID")
        
        response = admin_client.post("/daily-entries", data={
            "flower_type_id": flower_type_id,
            "entry_date": date.today().isoformat(),
            "entry_time": "05:30:00",
            "quantity": 10.00
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_daily_entry_invalid_farmer_returns_404(self, admin_client: APIClient):
        """Test POST /daily-entries returns 404 with invalid farmer_id"""
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not flower_type_id:
            pytest.skip("Could not get flower type ID")
        
        entry_data = DailyEntryCreate(
            farmer_id="00000000-0000-0000-0000-000000000000",
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00")
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_create_daily_entry_negative_quantity_returns_422(self, admin_client: APIClient):
        """Test POST /daily-entries returns 422 with negative quantity"""
        farmer_id = self._get_test_farmer_id(admin_client)
        flower_type_id = self._get_test_flower_type_id(admin_client)
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required test data")
        
        response = admin_client.post("/daily-entries", data={
            "farmer_id": farmer_id,
            "flower_type_id": flower_type_id,
            "entry_date": date.today().isoformat(),
            "entry_time": "05:30:00",
            "quantity": -10.00
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_daily_entry_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /daily-entries returns 401 without authentication"""
        entry_data = DailyEntryCreate(
            farmer_id="00000000-0000-0000-0000-000000000001",
            flower_type_id="00000000-0000-0000-0000-000000000001",
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00")
        )
        
        response = api_client_v2.post("/daily-entries", data=entry_data)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailyEntriesUpdate:
    """Tests for PUT /api/v1/daily-entries/{entry_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_update_daily_entry_returns_200(self, admin_client: APIClient):
        """Test PUT /daily-entries/{id} returns 200 with valid data"""
        # First get list of entries to find a valid ID
        list_response = admin_client.get("/daily-entries", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch daily entries list")
        
        list_data = list_response.json()
        entries = list_data.get("data", [])
        
        if not entries:
            pytest.skip("No daily entries available for testing")
        
        entry_id = entries[0]["id"]
        
        # Update entry
        update_data = DailyEntryUpdate(
            quantity=Decimal("15.00"),
            notes="Updated quantity"
        )
        
        response = admin_client.put(f"/daily-entries/{entry_id}", data=update_data)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate updated entry
        updated_entry = DailyEntryResponse.model_validate(data["data"])
        assert float(updated_entry.quantity) == 15.00

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_update_daily_entry_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /daily-entries/{id} returns 404 with invalid ID"""
        update_data = DailyEntryUpdate(quantity=Decimal("15.00"))
        
        response = admin_client.put(
            "/daily-entries/00000000-0000-0000-0000-000000000000",
            data=update_data
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_update_daily_entry_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /daily-entries/{id} returns 401 without authentication"""
        update_data = DailyEntryUpdate(quantity=Decimal("15.00"))
        
        response = api_client_v2.put(
            "/daily-entries/00000000-0000-0000-0000-000000000001",
            data=update_data
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailyEntriesDelete:
    """Tests for DELETE /api/v1/daily-entries/{entry_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_delete_daily_entry_returns_200(self, admin_client: APIClient):
        """Test DELETE /daily-entries/{id} returns 200 for valid entry"""
        # First get helper methods to create an entry
        farmer_response = admin_client.get("/farmers", params={"page_size": 1})
        flower_response = admin_client.get("/flower-types", params={"page_size": 1})
        
        if farmer_response.status_code != 200 or flower_response.status_code != 200:
            pytest.skip("Could not fetch required data")
        
        farmer_id = farmer_response.json().get("data", [{}])[0].get("id")
        flower_type_id = flower_response.json().get("data", [{}])[0].get("id")
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required IDs")
        
        # Create an entry to delete
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("5.00")
        )
        
        create_response = admin_client.post("/daily-entries", data=entry_data)
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create entry for deletion test")
        
        created_entry = create_response.json().get("data", {})
        entry_id = created_entry.get("id")
        
        if not entry_id:
            pytest.skip("Could not get created entry ID")
        
        # Delete the entry
        response = admin_client.delete(f"/daily-entries/{entry_id}")
        
        assert_status_code(response, HTTP_200_OK)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_delete_daily_entry_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /daily-entries/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/daily-entries/00000000-0000-0000-0000-000000000000")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_daily_entry_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test DELETE /daily-entries/{id} returns 401 without authentication"""
        response = api_client_v2.delete("/daily-entries/00000000-0000-0000-0000-000000000001")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailyEntriesCalculation:
    """Tests for automatic calculations in daily entries"""

    @pytest.mark.positive
    def test_entry_calculates_total_amount(self, admin_client: APIClient):
        """Test that entry automatically calculates total_amount from quantity * rate"""
        farmer_response = admin_client.get("/farmers", params={"page_size": 1})
        flower_response = admin_client.get("/flower-types", params={"page_size": 1})
        
        if farmer_response.status_code != 200 or flower_response.status_code != 200:
            pytest.skip("Could not fetch required data")
        
        farmer_id = farmer_response.json().get("data", [{}])[0].get("id")
        flower_type_id = flower_response.json().get("data", [{}])[0].get("id")
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required IDs")
        
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00")
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        if response.status_code not in [200, 201]:
            pytest.skip("Could not create entry")
        
        data = validate_success_response(response)
        entry = DailyEntryResponse.model_validate(data["data"])
        
        # Verify total_amount is calculated (quantity * rate_per_unit)
        expected_total = float(entry.quantity) * float(entry.rate_per_unit)
        assert abs(float(entry.total_amount) - expected_total) < 0.01
        
        # Cleanup
        if entry.id:
            admin_client.delete(f"/daily-entries/{entry.id}")

    @pytest.mark.positive
    def test_entry_calculates_commission(self, admin_client: APIClient):
        """Test that entry automatically calculates commission_amount"""
        farmer_response = admin_client.get("/farmers", params={"page_size": 1})
        flower_response = admin_client.get("/flower-types", params={"page_size": 1})
        
        if farmer_response.status_code != 200 or flower_response.status_code != 200:
            pytest.skip("Could not fetch required data")
        
        farmer_id = farmer_response.json().get("data", [{}])[0].get("id")
        flower_type_id = flower_response.json().get("data", [{}])[0].get("id")
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required IDs")
        
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00")
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        if response.status_code not in [200, 201]:
            pytest.skip("Could not create entry")
        
        data = validate_success_response(response)
        entry = DailyEntryResponse.model_validate(data["data"])
        
        # Verify commission is calculated
        assert entry.commission_rate is not None
        assert entry.commission_amount is not None
        
        expected_commission = float(entry.total_amount) * (float(entry.commission_rate) / 100)
        assert abs(float(entry.commission_amount) - expected_commission) < 0.01
        
        # Cleanup
        if entry.id:
            admin_client.delete(f"/daily-entries/{entry.id}")

    @pytest.mark.positive
    def test_entry_calculates_net_amount(self, admin_client: APIClient):
        """Test that entry calculates net_amount correctly"""
        farmer_response = admin_client.get("/farmers", params={"page_size": 1})
        flower_response = admin_client.get("/flower-types", params={"page_size": 1})
        
        if farmer_response.status_code != 200 or flower_response.status_code != 200:
            pytest.skip("Could not fetch required data")
        
        farmer_id = farmer_response.json().get("data", [{}])[0].get("id")
        flower_type_id = flower_response.json().get("data", [{}])[0].get("id")
        
        if not farmer_id or not flower_type_id:
            pytest.skip("Could not get required IDs")
        
        entry_data = DailyEntryCreate(
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            entry_date=date.today().isoformat(),
            entry_time="05:30:00",
            quantity=Decimal("10.00"),
            manual_adj_amount=Decimal("-50.00")
        )
        
        response = admin_client.post("/daily-entries", data=entry_data)
        
        if response.status_code not in [200, 201]:
            pytest.skip("Could not create entry")
        
        data = validate_success_response(response)
        entry = DailyEntryResponse.model_validate(data["data"])
        
        # net_amount = total_amount - commission_amount + manual_adj_amount
        expected_net = (
            float(entry.total_amount) -
            float(entry.commission_amount) +
            float(entry.manual_adj_amount or 0)
        )
        assert abs(float(entry.net_amount) - expected_net) < 0.01
        
        # Cleanup
        if entry.id:
            admin_client.delete(f"/daily-entries/{entry.id}")
