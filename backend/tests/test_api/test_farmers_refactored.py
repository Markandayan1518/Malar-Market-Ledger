"""
Tests for Farmers Endpoints

This module contains tests for the /api/v1/farmers endpoints including:
- GET /farmers - List all farmers
- GET /farmers/{farmer_id} - Get farmer by ID
- POST /farmers - Create new farmer
- PUT /farmers/{farmer_id} - Update farmer
- GET /farmers/{farmer_id}/balance - Get farmer balance

Uses Pydantic schemas for request serialization and response validation.
"""

import pytest
import os
from datetime import datetime

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
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_ENTITY,
    ERROR_VALIDATION,
    ERROR_RESOURCE_NOT_FOUND,
    ERROR_RESOURCE_ALREADY_EXISTS,
    ERROR_PERMISSION_DENIED,
)
from tests.schemas.farmers import (
    FarmerResponse,
    FarmerCreate,
    FarmerUpdate,
    FarmerBalanceResponse,
    NestedFarmer,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestFarmersList:
    """Tests for GET /api/v1/farmers"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_farmers_returns_200(self, admin_client: APIClient):
        """Test GET /farmers returns 200 with paginated farmer list"""
        response = admin_client.get("/farmers")
        
        assert_status_code(response, HTTP_200_OK)
        
        # Validate paginated response structure
        data = validate_paginated_response(response)
        
        # Validate pagination metadata
        assert "pagination" in data
        pagination = data["pagination"]
        assert "page" in pagination
        assert "page_size" in pagination
        assert "total_items" in pagination
        assert "total_pages" in pagination

    @pytest.mark.positive
    def test_list_farmers_with_pagination(self, admin_client: APIClient):
        """Test GET /farmers with pagination parameters"""
        response = admin_client.get("/farmers", params={"page": 1, "page_size": 10})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10

    @pytest.mark.positive
    def test_list_farmers_with_search(self, admin_client: APIClient):
        """Test GET /farmers with search parameter"""
        response = admin_client.get("/farmers", params={"search": "Raj"})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        # Validate response structure
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_farmers_with_is_active_filter(self, admin_client: APIClient):
        """Test GET /farmers with is_active filter"""
        response = admin_client.get("/farmers", params={"is_active": True})
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)
        
        # All returned farmers should be active
        for farmer in data["data"]:
            if "is_active" in farmer:
                assert farmer["is_active"] is True

    @pytest.mark.positive
    def test_list_farmers_staff_access(self, staff_client: APIClient):
        """Test GET /farmers returns 200 for staff users"""
        response = staff_client.get("/farmers")
        
        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_farmers_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /farmers returns 401 without authentication"""
        response = api_client_v2.get("/farmers")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersGet:
    """Tests for GET /api/v1/farmers/{farmer_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_farmer_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /farmers/{id} returns 200 with farmer details"""
        # First get list of farmers to find a valid ID
        list_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        # Get specific farmer
        response = admin_client.get(f"/farmers/{farmer_id}")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate farmer response schema
        farmer = FarmerResponse.model_validate(data["data"])
        assert farmer.id == farmer_id

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_farmer_by_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /farmers/{id} returns 404 with invalid ID"""
        response = admin_client.get("/farmers/00000000-0000-0000-0000-000000000000")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_farmer_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /farmers/{id} returns 401 without authentication"""
        response = api_client_v2.get("/farmers/00000000-0000-0000-0000-000000000001")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersCreate:
    """Tests for POST /api/v1/farmers"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_create_farmer_returns_201(self, admin_client: APIClient):
        """Test POST /farmers returns 201 with valid data"""
        # Generate unique farmer data
        import uuid
        unique_code = f"FAR{uuid.uuid4().hex[:6].upper()}"
        
        farmer_data = FarmerCreate(
            farmer_code=unique_code,
            name="Test Farmer",
            village="Test Village",
            phone=f"+91{uuid.uuid4().hex[:10]}",
            whatsapp_number=f"+91{uuid.uuid4().hex[:10]}",
            address="Test Address",
            commission_pct=10.00,
            flat_fee_monthly=0.00
        )
        
        response = admin_client.post("/farmers", data=farmer_data)
        
        # Accept 201 or 200 as valid creation responses
        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = validate_success_response(response)
        
        # Validate created farmer
        created_farmer = FarmerResponse.model_validate(data["data"])
        assert created_farmer.farmer_code == unique_code
        assert created_farmer.name == "Test Farmer"
        
        # Cleanup - delete the created farmer
        if created_farmer.id:
            admin_client.delete(f"/farmers/{created_farmer.id}")

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_farmer_duplicate_code_returns_409(self, admin_client: APIClient):
        """Test POST /farmers returns 409 with duplicate farmer code"""
        # First get existing farmers to find a code
        list_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No existing farmers to test duplicate code")
        
        existing_code = farmers[0].get("farmer_code")
        if not existing_code:
            pytest.skip("No farmer code found")
        
        # Try to create with duplicate code
        import uuid
        farmer_data = FarmerCreate(
            farmer_code=existing_code,  # Duplicate code
            name="Duplicate Farmer",
            village="Test Village",
            phone=f"+91{uuid.uuid4().hex[:10]}",
            commission_pct=10.00
        )
        
        response = admin_client.post("/farmers", data=farmer_data)
        
        assert_status_code(response, HTTP_409_CONFLICT)

    @pytest.mark.negative
    def test_create_farmer_missing_required_fields_returns_422(self, admin_client: APIClient):
        """Test POST /farmers returns 422 with missing required fields"""
        response = admin_client.post("/farmers", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_create_farmer_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /farmers returns 403 for staff users"""
        import uuid
        farmer_data = FarmerCreate(
            farmer_code=f"FAR{uuid.uuid4().hex[:6].upper()}",
            name="Test Farmer",
            village="Test Village",
            phone=f"+91{uuid.uuid4().hex[:10]}",
            commission_pct=10.00
        )
        
        response = staff_client.post("/farmers", data=farmer_data)
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_create_farmer_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /farmers returns 401 without authentication"""
        import uuid
        farmer_data = FarmerCreate(
            farmer_code=f"FAR{uuid.uuid4().hex[:6].upper()}",
            name="Test Farmer",
            village="Test Village",
            phone=f"+91{uuid.uuid4().hex[:10]}",
            commission_pct=10.00
        )
        
        response = api_client_v2.post("/farmers", data=farmer_data)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersUpdate:
    """Tests for PUT /api/v1/farmers/{farmer_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_update_farmer_returns_200(self, admin_client: APIClient):
        """Test PUT /farmers/{id} returns 200 with valid data"""
        # First get list of farmers to find a valid ID
        list_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        # Update farmer
        update_data = FarmerUpdate(
            name="Updated Farmer Name",
            commission_pct=12.00
        )
        
        response = admin_client.put(f"/farmers/{farmer_id}", data=update_data)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate updated farmer
        updated_farmer = FarmerResponse.model_validate(data["data"])
        assert updated_farmer.name == "Updated Farmer Name"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_update_farmer_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /farmers/{id} returns 404 with invalid ID"""
        update_data = FarmerUpdate(name="Updated Name")
        
        response = admin_client.put(
            "/farmers/00000000-0000-0000-0000-000000000000",
            data=update_data
        )
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_update_farmer_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /farmers/{id} returns 403 for staff users"""
        # First get list of farmers to find a valid ID
        list_response = staff_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        update_data = FarmerUpdate(name="Updated Name")
        response = staff_client.put(f"/farmers/{farmer_id}", data=update_data)
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_update_farmer_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /farmers/{id} returns 401 without authentication"""
        update_data = FarmerUpdate(name="Updated Name")
        
        response = api_client_v2.put(
            "/farmers/00000000-0000-0000-0000-000000000001",
            data=update_data
        )
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersDelete:
    """Tests for DELETE /api/v1/farmers/{farmer_id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_delete_farmer_returns_200(self, admin_client: APIClient):
        """Test DELETE /farmers/{id} returns 200 for valid farmer"""
        # First create a farmer to delete
        import uuid
        unique_code = f"FAR{uuid.uuid4().hex[:6].upper()}"
        
        farmer_data = FarmerCreate(
            farmer_code=unique_code,
            name="Farmer to Delete",
            village="Test Village",
            phone=f"+91{uuid.uuid4().hex[:10]}",
            commission_pct=10.00
        )
        
        create_response = admin_client.post("/farmers", data=farmer_data)
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create farmer for deletion test")
        
        created_farmer = create_response.json().get("data", {})
        farmer_id = created_farmer.get("id")
        
        if not farmer_id:
            pytest.skip("Could not get created farmer ID")
        
        # Delete the farmer
        response = admin_client.delete(f"/farmers/{farmer_id}")
        
        assert_status_code(response, HTTP_200_OK)

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_delete_farmer_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /farmers/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/farmers/00000000-0000-0000-0000-000000000000")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_farmer_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /farmers/{id} returns 403 for staff users"""
        # First get list of farmers to find a valid ID
        list_response = staff_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        response = staff_client.delete(f"/farmers/{farmer_id}")
        
        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_delete_farmer_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test DELETE /farmers/{id} returns 401 without authentication"""
        response = api_client_v2.delete("/farmers/00000000-0000-0000-0000-000000000001")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersBalance:
    """Tests for GET /api/v1/farmers/{farmer_id}/balance"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_farmer_balance_returns_200(self, admin_client: APIClient):
        """Test GET /farmers/{id}/balance returns 200 with balance details"""
        # First get list of farmers to find a valid ID
        list_response = admin_client.get("/farmers", params={"page_size": 1})
        
        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")
        
        list_data = list_response.json()
        farmers = list_data.get("data", [])
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0]["id"]
        
        # Get farmer balance
        response = admin_client.get(f"/farmers/{farmer_id}/balance")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate balance response schema
        balance = FarmerBalanceResponse.model_validate(data["data"])
        assert balance.farmer_id == farmer_id

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_farmer_balance_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /farmers/{id}/balance returns 404 with invalid ID"""
        response = admin_client.get("/farmers/00000000-0000-0000-0000-000000000000/balance")
        
        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_farmer_balance_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /farmers/{id}/balance returns 401 without authentication"""
        response = api_client_v2.get("/farmers/00000000-0000-0000-0000-000000000001/balance")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)
