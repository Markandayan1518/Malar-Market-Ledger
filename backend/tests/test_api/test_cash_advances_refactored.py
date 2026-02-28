"""
Tests for Cash Advances Endpoints

This module contains tests for the /api/v1/cash-advances endpoints including:
- GET /cash-advances - List all cash advances
- POST /cash-advances - Create new cash advance request
- PUT /cash-advances/{advance_id}/approve - Approve cash advance
- PUT /cash-advances/{advance_id}/reject - Reject cash advance

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
from tests.schemas.cash_advances import (
    CashAdvanceResponse,
    CashAdvanceCreate,
    CashAdvanceApprove,
    CashAdvanceReject,
    AdvanceStatus,
    NestedFarmerInAdvance,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestCashAdvancesList:
    """Tests for GET /api/v1/cash-advances"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_cash_advances_returns_200(self, admin_client: APIClient):
        """Test GET /cash-advances returns 200 with paginated list"""
        response = admin_client.get("/cash-advances")
        
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
    def test_list_cash_advances_with_pagination(self, admin_client: APIClient):
        """Test GET /cash-advances with pagination parameters"""
        response = admin_client.get("/cash-advances", params={"page": 1, "page_size": 10})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10

    @pytest.mark.positive
    def test_list_cash_advances_with_farmer_filter(self, admin_client: APIClient):
        """Test GET /cash-advances with farmer_id filter"""
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
        response = admin_client.get("/cash-advances", params={"farmer_id": farmer_id})
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_cash_advances_with_status_filter(self, admin_client: APIClient):
        """Test GET /cash-advances with status filter"""
        response = admin_client.get("/cash-advances", params={"status": "pending"})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        # All returned advances should have pending status
        for advance in data["data"]:
            if "status" in advance:
                assert advance["status"] == "pending"

    @pytest.mark.positive
    def test_list_cash_advances_staff_access(self, staff_client: APIClient):
        """Test GET /cash-advances returns 200 for staff users"""
        response = staff_client.get("/cash-advances")
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_cash_advances_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /cash-advances returns 401 without authentication"""
        response = api_client_v2.get("/cash-advances")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCashAdvancesCreate:
    """Tests for POST /api/v1/cash-advances"""

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
    def test_create_cash_advance_returns_200(self, admin_client: APIClient):
        """Test POST /cash-advances returns 200 with valid data"""
        farmer_id = self._get_test_farmer_id(admin_client)
        
        if not farmer_id:
            pytest.skip("No farmers available for testing")
        
        advance_data = CashAdvanceCreate(
            farmer_id=farmer_id,
            amount=Decimal("5000.00"),
            reason="Emergency medical expense",
            advance_date=date.today().isoformat(),
            notes="Urgent request"
        )
        
        response = admin_client.post("/cash-advances", data=advance_data)
        
        # Accept 201 or 200 as valid creation responses
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = validate_success_response(response)
        
        # Validate created advance
        created_advance = CashAdvanceResponse.model_validate(data["data"])
        assert created_advance.farmer_id == farmer_id
        assert float(created_advance.amount) == 5000.00
        assert created_advance.status == AdvanceStatus.PENDING

    @pytest.mark.positive
    def test_create_cash_advance_staff_access(self, staff_client: APIClient):
        """Test POST /cash-advances returns 200 for staff users"""
        farmer_id = self._get_test_farmer_id(staff_client)
        
        if not farmer_id:
            pytest.skip("No farmers available for testing")
        
        advance_data = CashAdvanceCreate(
            farmer_id=farmer_id,
            amount=Decimal("3000.00"),
            reason="Test advance",
            advance_date=date.today().isoformat()
        )
        
        response = staff_client.post("/cash-advances", data=advance_data)
        
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED]

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_cash_advance_missing_farmer_returns_422(self, admin_client: APIClient):
        """Test POST /cash-advances returns 422 with missing farmer_id"""
        response = admin_client.post("/cash-advances", data={
            "amount": 5000.00,
            "reason": "Test",
            "advance_date": date.today().isoformat()
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_cash_advance_invalid_farmer_returns_404(self, admin_client: APIClient):
        """Test POST /cash-advances returns 404 with invalid farmer_id"""
        advance_data = CashAdvanceCreate(
            farmer_id="00000000-0000-0000-0000-000000000000",
            amount=Decimal("5000.00"),
            reason="Test",
            advance_date=date.today().isoformat()
        )
        
        response = admin_client.post("/cash-advances", data=advance_data)
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_create_cash_advance_negative_amount_returns_422(self, admin_client: APIClient):
        """Test POST /cash-advances returns 422 with negative amount"""
        farmer_id = self._get_test_farmer_id(admin_client)
        
        if not farmer_id:
            pytest.skip("No farmers available for testing")
        
        response = admin_client.post("/cash-advances", data={
            "farmer_id": farmer_id,
            "amount": -5000.00,
            "reason": "Test",
            "advance_date": date.today().isoformat()
        })
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_cash_advance_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /cash-advances returns 401 without authentication"""
        advance_data = CashAdvanceCreate(
            farmer_id="00000000-0000-0000-0000-000000000001",
            amount=Decimal("5000.00"),
            reason="Test",
            advance_date=date.today().isoformat()
        )
        
        response = api_client_v2.post("/cash-advances", data=advance_data)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCashAdvancesApprove:
    """Tests for PUT /api/v1/cash-advances/{advance_id}/approve"""

    # ==================== HELPER METHODS ====================

    def _create_pending_advance(self, client: APIClient) -> str:
        """Create a pending cash advance and return its ID"""
        # Get farmer ID
        farmer_response = client.get("/farmers", params={"page_size": 1})
        if farmer_response.status_code != 200:
            return None
        
        farmers = farmer_response.json().get("data", [])
        if not farmers:
            return None
        
        farmer_id = farmers[0]["id"]
        
        # Create advance
        advance_data = CashAdvanceCreate(
            farmer_id=farmer_id,
            amount=Decimal("1000.00"),
            reason="Test advance for approval",
            advance_date=date.today().isoformat()
        )
        
        response = client.post("/cash-advances", data=advance_data)
        if response.status_code not in [200, 201]:
            return None
        
        return response.json().get("data", {}).get("id")

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_approve_cash_advance_returns_200(self, admin_client: APIClient):
        """Test PUT /cash-advances/{id}/approve returns 200"""
        # First check for existing pending advances
        list_response = admin_client.get("/cash-advances", params={"status": "pending"})
        
        advance_id = None
        if list_response.status_code == 200:
            advances = list_response.json().get("data", [])
            if advances:
                advance_id = advances[0]["id"]
        
        if not advance_id:
            # Create a new pending advance
            advance_id = self._create_pending_advance(admin_client)
        
        if not advance_id:
            pytest.skip("Could not create or find pending cash advance")
        
        # Approve the advance
        approve_data = CashAdvanceApprove(notes="Approved for testing")
        
        response = admin_client.put(f"/cash-advances/{advance_id}/approve", data=approve_data)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate approved advance
        approved_advance = CashAdvanceResponse.model_validate(data["data"])
        assert approved_advance.status == AdvanceStatus.APPROVED

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_approve_cash_advance_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /cash-advances/{id}/approve returns 404 with invalid ID"""
        approve_data = CashAdvanceApprove(notes="Test")
        
        response = admin_client.put(
            "/cash-advances/00000000-0000-0000-0000-000000000000/approve",
            data=approve_data
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_approve_cash_advance_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /cash-advances/{id}/approve returns 403 for staff users"""
        # Get any cash advance
        list_response = staff_client.get("/cash-advances", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch cash advances")
        
        advances = list_response.json().get("data", [])
        if not advances:
            pytest.skip("No cash advances available for testing")
        
        advance_id = advances[0]["id"]
        
        approve_data = CashAdvanceApprove(notes="Test")
        response = staff_client.put(f"/cash-advances/{advance_id}/approve", data=approve_data)
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_approve_cash_advance_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /cash-advances/{id}/approve returns 401 without authentication"""
        approve_data = CashAdvanceApprove(notes="Test")
        
        response = api_client_v2.put(
            "/cash-advances/00000000-0000-0000-0000-000000000001/approve",
            data=approve_data
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCashAdvancesReject:
    """Tests for PUT /api/v1/cash-advances/{advance_id}/reject"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_reject_cash_advance_returns_200(self, admin_client: APIClient):
        """Test PUT /cash-advances/{id}/reject returns 200"""
        # Create a new pending advance to reject
        farmer_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if farmer_response.status_code != 200:
            pytest.skip("Could not fetch farmers")
        
        farmers = farmer_response.json().get("data", [])
        if not farmers:
            pytest.skip("No farmers available")
        
        farmer_id = farmers[0]["id"]
        
        # Create advance
        advance_data = CashAdvanceCreate(
            farmer_id=farmer_id,
            amount=Decimal("500.00"),
            reason="Test advance for rejection",
            advance_date=date.today().isoformat()
        )
        
        create_response = admin_client.post("/cash-advances", data=advance_data)
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create cash advance")
        
        advance_id = create_response.json().get("data", {}).get("id")
        if not advance_id:
            pytest.skip("Could not get advance ID")
        
        # Reject the advance
        reject_data = CashAdvanceReject(notes="Insufficient balance")
        
        response = admin_client.put(f"/cash-advances/{advance_id}/reject", data=reject_data)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate rejected advance
        rejected_advance = CashAdvanceResponse.model_validate(data["data"])
        assert rejected_advance.status == AdvanceStatus.REJECTED

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_reject_cash_advance_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /cash-advances/{id}/reject returns 404 with invalid ID"""
        reject_data = CashAdvanceReject(notes="Test")
        
        response = admin_client.put(
            "/cash-advances/00000000-0000-0000-0000-000000000000/reject",
            data=reject_data
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_reject_cash_advance_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /cash-advances/{id}/reject returns 403 for staff users"""
        # Get any cash advance
        list_response = staff_client.get("/cash-advances", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch cash advances")
        
        advances = list_response.json().get("data", [])
        if not advances:
            pytest.skip("No cash advances available for testing")
        
        advance_id = advances[0]["id"]
        
        reject_data = CashAdvanceReject(notes="Test")
        response = staff_client.put(f"/cash-advances/{advance_id}/reject", data=reject_data)
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_reject_cash_advance_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /cash-advances/{id}/reject returns 401 without authentication"""
        reject_data = CashAdvanceReject(notes="Test")
        
        response = api_client_v2.put(
            "/cash-advances/00000000-0000-0000-0000-000000000001/reject",
            data=reject_data
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)
