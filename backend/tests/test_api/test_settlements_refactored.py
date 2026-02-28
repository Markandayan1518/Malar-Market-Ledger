"""
Tests for Settlements Endpoints

This module contains tests for the /api/v1/settlements endpoints including:
- GET /settlements - List all settlements
- GET /settlements/{settlement_id} - Get settlement by ID with items
- POST /settlements/generate - Generate settlement for a farmer
- PUT /settlements/{settlement_id}/approve - Approve settlement
- PUT /settlements/{settlement_id}/mark-paid - Mark settlement as paid

Uses Pydantic schemas for request serialization and response validation.
"""

import pytest
import os
from datetime import date, datetime, timedelta
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
from tests.schemas.settlements import (
    SettlementResponse,
    SettlementGenerate,
    SettlementApprove,
    SettlementStatus,
    NestedFarmerInSettlement,
    SettlementItem,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestSettlementsList:
    """Tests for GET /api/v1/settlements"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_settlements_returns_200(self, admin_client: APIClient):
        """Test GET /settlements returns 200 with paginated list"""
        response = admin_client.get("/settlements")
        
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
    def test_list_settlements_with_pagination(self, admin_client: APIClient):
        """Test GET /settlements with pagination parameters"""
        response = admin_client.get("/settlements", params={"page": 1, "page_size": 10})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10

    @pytest.mark.positive
    def test_list_settlements_with_farmer_filter(self, admin_client: APIClient):
        """Test GET /settlements with farmer_id filter"""
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
        response = admin_client.get("/settlements", params={"farmer_id": farmer_id})
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_settlements_with_status_filter(self, admin_client: APIClient):
        """Test GET /settlements with status filter"""
        response = admin_client.get("/settlements", params={"status": "pending_approval"})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        # All returned settlements should have pending_approval status
        for settlement in data["data"]:
            if "status" in settlement:
                assert settlement["status"] == "pending_approval"

    @pytest.mark.positive
    def test_list_settlements_with_date_filter(self, admin_client: APIClient):
        """Test GET /settlements with date filters"""
        today = date.today()
        
        response = admin_client.get("/settlements", params={
            "date_from": (today - timedelta(days=30)).isoformat(),
            "date_to": today.isoformat()
        })
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_settlements_staff_access(self, staff_client: APIClient):
        """Test GET /settlements returns 200 for staff users"""
        response = staff_client.get("/settlements")
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_settlements_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /settlements returns 401 without authentication"""
        response = api_client_v2.get("/settlements")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestSettlementsGet:
    """Tests for GET /api/v1/settlements/{settlement_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_settlement_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /settlements/{id} returns 200 with settlement details"""
        # First get list of settlements to find a valid ID
        list_response = admin_client.get("/settlements", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch settlements list")
        
        list_data = list_response.json()
        settlements = list_data.get("data", [])
        
        if not settlements:
            pytest.skip("No settlements available for testing")
        
        settlement_id = settlements[0]["id"]
        
        # Get specific settlement
        response = admin_client.get(f"/settlements/{settlement_id}")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate settlement response schema
        settlement = SettlementResponse.model_validate(data["data"])
        assert settlement.id == settlement_id

    @pytest.mark.positive
    def test_get_settlement_includes_items(self, admin_client: APIClient):
        """Test GET /settlements/{id} includes settlement items"""
        # First get list of settlements
        list_response = admin_client.get("/settlements", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch settlements list")
        
        list_data = list_response.json()
        settlements = list_data.get("data", [])
        
        if not settlements:
            pytest.skip("No settlements available for testing")
        
        settlement_id = settlements[0]["id"]
        
        # Get settlement details
        response = admin_client.get(f"/settlements/{settlement_id}")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Check if items are included
        if "items" in data["data"]:
            items = data["data"]["items"]
            assert isinstance(items, list)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_settlement_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /settlements/{id} returns 404 with invalid ID"""
        response = admin_client.get("/settlements/00000000-0000-0000-0000-000000000000")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_settlement_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /settlements/{id} returns 401 without authentication"""
        response = api_client_v2.get("/settlements/00000000-0000-0000-0000-000000000001")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestSettlementsGenerate:
    """Tests for POST /api/v1/settlements/generate"""

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

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_generate_settlement_returns_200(self, admin_client: APIClient):
        """Test POST /settlements/generate returns 200 with valid data"""
        farmer_id = self._get_test_farmer_id(admin_client)
        
        if not farmer_id:
            pytest.skip("No farmers available for testing")
        
        # Use a date range that might have entries
        today = date.today()
        period_start = (today - timedelta(days=30)).isoformat()
        period_end = today.isoformat()
        
        generate_data = SettlementGenerate(
            farmer_id=farmer_id,
            period_start=period_start,
            period_end=period_end,
            notes="Test settlement generation"
        )
        
        response = admin_client.post("/settlements/generate", data=generate_data)
        
        # May return 200/201 or 422 if no entries in period
        if response.status_code == HTTP_422_UNPROCESSABLE_ENTITY:
            pytest.skip("No entries found in the specified period")
        
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = validate_success_response(response)
        
        # Validate generated settlement
        settlement = SettlementResponse.model_validate(data["data"])
        assert settlement.farmer_id == farmer_id
        assert settlement.status in [SettlementStatus.DRAFT, SettlementStatus.PENDING_APPROVAL]

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_generate_settlement_missing_farmer_returns_422(self, admin_client: APIClient):
        """Test POST /settlements/generate returns 422 with missing farmer_id"""
        today = date.today()
        
        response = admin_client.post("/settlements/generate", data={
            "period_start": today.isoformat(),
            "period_end": today.isoformat()
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_generate_settlement_invalid_farmer_returns_404(self, admin_client: APIClient):
        """Test POST /settlements/generate returns 404 with invalid farmer_id"""
        today = date.today()
        
        generate_data = SettlementGenerate(
            farmer_id="00000000-0000-0000-0000-000000000000",
            period_start=today.isoformat(),
            period_end=today.isoformat()
        )
        
        response = admin_client.post("/settlements/generate", data=generate_data)
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_generate_settlement_invalid_date_range_returns_422(self, admin_client: APIClient):
        """Test POST /settlements/generate returns 422 with invalid date range"""
        farmer_id = self._get_test_farmer_id(admin_client)
        
        if not farmer_id:
            pytest.skip("No farmers available for testing")
        
        # End date before start date
        today = date.today()
        
        response = admin_client.post("/settlements/generate", data={
            "farmer_id": farmer_id,
            "period_start": today.isoformat(),
            "period_end": (today - timedelta(days=10)).isoformat()
        })
        
        # May return 422 for validation error
        assert response.status_code in [HTTP_400_BAD_REQUEST, HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.negative
    def test_generate_settlement_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /settlements/generate returns 401 without authentication"""
        today = date.today()
        
        generate_data = SettlementGenerate(
            farmer_id="00000000-0000-0000-0000-000000000001",
            period_start=today.isoformat(),
            period_end=today.isoformat()
        )
        
        response = api_client_v2.post("/settlements/generate", data=generate_data)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestSettlementsApprove:
    """Tests for PUT /api/v1/settlements/{settlement_id}/approve"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_approve_settlement_returns_200(self, admin_client: APIClient):
        """Test PUT /settlements/{id}/approve returns 200"""
        # Find a settlement that can be approved (pending_approval status)
        list_response = admin_client.get("/settlements", params={"status": "pending_approval"})
        
        settlement_id = None
        if list_response.status_code == 200:
            settlements = list_response.json().get("data", [])
            if settlements:
                settlement_id = settlements[0]["id"]
        
        if not settlement_id:
            # Try to find any draft settlement
            draft_response = admin_client.get("/settlements", params={"status": "draft"})
            if draft_response.status_code == 200:
                settlements = draft_response.json().get("data", [])
                if settlements:
                    settlement_id = settlements[0]["id"]
        
        if not settlement_id:
            pytest.skip("No settlements available for approval testing")
        
        # Approve the settlement
        approve_data = SettlementApprove(notes="Approved for testing")
        
        response = admin_client.put(f"/settlements/{settlement_id}/approve", data=approve_data)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate approved settlement
        approved_settlement = SettlementResponse.model_validate(data["data"])
        assert approved_settlement.status == SettlementStatus.APPROVED

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_approve_settlement_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /settlements/{id}/approve returns 404 with invalid ID"""
        approve_data = SettlementApprove(notes="Test")
        
        response = admin_client.put(
            "/settlements/00000000-0000-0000-0000-000000000000/approve",
            data=approve_data
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_approve_settlement_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /settlements/{id}/approve returns 401 without authentication"""
        approve_data = SettlementApprove(notes="Test")
        
        response = api_client_v2.put(
            "/settlements/00000000-0000-0000-0000-000000000001/approve",
            data=approve_data
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestSettlementsMarkPaid:
    """Tests for PUT /api/v1/settlements/{settlement_id}/mark-paid"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_mark_settlement_paid_returns_200(self, admin_client: APIClient):
        """Test PUT /settlements/{id}/mark-paid returns 200"""
        # Find an approved settlement that can be marked as paid
        list_response = admin_client.get("/settlements", params={"status": "approved"})
        
        settlement_id = None
        if list_response.status_code == 200:
            settlements = list_response.json().get("data", [])
            if settlements:
                settlement_id = settlements[0]["id"]
        
        if not settlement_id:
            pytest.skip("No approved settlements available for payment testing")
        
        # Mark as paid
        response = admin_client.put(f"/settlements/{settlement_id}/mark-paid")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate paid settlement
        paid_settlement = SettlementResponse.model_validate(data["data"])
        assert paid_settlement.status == SettlementStatus.PAID
        assert paid_settlement.paid_at is not None

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_mark_settlement_paid_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /settlements/{id}/mark-paid returns 404 with invalid ID"""
        response = admin_client.put(
            "/settlements/00000000-0000-0000-0000-000000000000/mark-paid"
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_mark_settlement_paid_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /settlements/{id}/mark-paid returns 403 for staff users"""
        # Get any settlement
        list_response = staff_client.get("/settlements", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch settlements")
        
        settlements = list_response.json().get("data", [])
        if not settlements:
            pytest.skip("No settlements available for testing")
        
        settlement_id = settlements[0]["id"]
        
        response = staff_client.put(f"/settlements/{settlement_id}/mark-paid")
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_mark_settlement_paid_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /settlements/{id}/mark-paid returns 401 without authentication"""
        response = api_client_v2.put(
            "/settlements/00000000-0000-0000-0000-000000000001/mark-paid"
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestSettlementsCalculations:
    """Tests for settlement calculations"""

    @pytest.mark.positive
    def test_settlement_response_schema_validation(self, admin_client: APIClient):
        """Test that settlement response validates against schema"""
        list_response = admin_client.get("/settlements", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch settlements")
        
        data = list_response.json()
        settlements = data.get("data", [])
        
        if not settlements:
            pytest.skip("No settlements available for testing")
        
        # Validate first settlement against schema
        settlement = SettlementResponse.model_validate(settlements[0])
        
        # Verify calculated fields are present
        assert settlement.gross_amount is not None
        assert settlement.total_commission is not None
        assert settlement.net_payable is not None

    @pytest.mark.positive
    def test_settlement_includes_farmer_details(self, admin_client: APIClient):
        """Test that settlement response includes nested farmer details"""
        list_response = admin_client.get("/settlements", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch settlements")
        
        data = list_response.json()
        settlements = data.get("data", [])
        
        if not settlements:
            pytest.skip("No settlements available for testing")
        
        settlement = settlements[0]
        
        # Validate nested farmer structure
        if "farmer" in settlement:
            farmer = NestedFarmerInSettlement.model_validate(settlement["farmer"])
            assert farmer.name is not None
