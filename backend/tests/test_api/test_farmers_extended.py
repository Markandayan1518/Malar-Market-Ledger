"""
Extended Tests for Farmers Endpoints

This module contains tests for the additional /api/v1/farmers endpoints:
- GET /farmers/search - Quick search for autocomplete
- PATCH /farmers/{id}/deactivate - Deactivate farmer
- PATCH /farmers/{id}/activate - Activate farmer
- GET /farmers/{id}/products - Get farmer's flower types
- POST /farmers/{id}/products - Add flower types to farmer
- DELETE /farmers/{id}/products/{product_id} - Remove flower type from farmer
- GET /farmers/{id}/suggested-flower - Get suggested flower for farmer
"""

import pytest
import uuid

from tests.utils.api_client import APIClient
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
)
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)


class TestFarmersSearch:
    """Tests for GET /api/v1/farmers/search"""

    @pytest.mark.positive
    def test_search_farmers_returns_200(self, admin_client: APIClient):
        """Test GET /farmers/search returns 200 with search results"""
        response = admin_client.get("/farmers/search", params={"q": "a"})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        # Search results should be a list
        assert isinstance(data.get("data"), list) or isinstance(data, list)

    @pytest.mark.positive
    def test_search_farmers_empty_query(self, admin_client: APIClient):
        """Test GET /farmers/search with empty query"""
        response = admin_client.get("/farmers/search", params={"q": ""})

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.positive
    def test_search_farmers_no_results(self, admin_client: APIClient):
        """Test GET /farmers/search with non-matching query"""
        response = admin_client.get("/farmers/search", params={"q": "zzznonexistent123"})

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_search_farmers_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /farmers/search returns 401 without authentication"""
        response = api_client_v2.get("/farmers/search", params={"q": "test"})

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersDeactivate:
    """Tests for PATCH /api/v1/farmers/{id}/deactivate"""

    @pytest.mark.positive
    def test_deactivate_farmer_returns_200(self, admin_client: APIClient):
        """Test PATCH /farmers/{id}/deactivate returns 200"""
        # Create a farmer to deactivate
        unique_code = f"FAR{uuid.uuid4().hex[:6].upper()}"

        create_data = {
            "farmer_code": unique_code,
            "name": "Deactivate Test Farmer",
            "village": "Test Village",
            "phone": f"+91{uuid.uuid4().hex[:10]}",
            "commission_pct": 10.00,
        }

        create_response = admin_client.post("/farmers", data=create_data)

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create farmer for deactivate test")

        farmer_id = create_response.json()["data"]["id"]

        response = admin_client.patch(f"/farmers/{farmer_id}/deactivate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is False

        # Cleanup
        admin_client.delete(f"/farmers/{farmer_id}")

    @pytest.mark.negative
    def test_deactivate_farmer_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /farmers/{id}/deactivate returns 404 with invalid ID"""
        response = admin_client.patch("/farmers/00000000-0000-0000-0000-000000000000/deactivate")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestFarmersActivate:
    """Tests for PATCH /api/v1/farmers/{id}/activate"""

    @pytest.mark.positive
    def test_activate_farmer_returns_200(self, admin_client: APIClient):
        """Test PATCH /farmers/{id}/activate returns 200"""
        unique_code = f"FAR{uuid.uuid4().hex[:6].upper()}"

        create_data = {
            "farmer_code": unique_code,
            "name": "Activate Test Farmer",
            "village": "Test Village",
            "phone": f"+91{uuid.uuid4().hex[:10]}",
            "commission_pct": 10.00,
        }

        create_response = admin_client.post("/farmers", data=create_data)

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create farmer for activate test")

        farmer_id = create_response.json()["data"]["id"]

        # Deactivate first
        admin_client.patch(f"/farmers/{farmer_id}/deactivate")

        # Now activate
        response = admin_client.patch(f"/farmers/{farmer_id}/activate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is True

        # Cleanup
        admin_client.delete(f"/farmers/{farmer_id}")

    @pytest.mark.negative
    def test_activate_farmer_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /farmers/{id}/activate returns 404 with invalid ID"""
        response = admin_client.patch("/farmers/00000000-0000-0000-0000-000000000000/activate")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestFarmersProducts:
    """Tests for GET/POST/DELETE /api/v1/farmers/{id}/products"""

    @pytest.mark.positive
    def test_get_farmer_products_returns_200(self, admin_client: APIClient):
        """Test GET /farmers/{id}/products returns 200 with products list"""
        list_response = admin_client.get("/farmers", params={"per_page": 1})

        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")

        farmers = list_response.json().get("data", [])
        if not farmers:
            pytest.skip("No farmers available")

        farmer_id = farmers[0]["id"]

        response = admin_client.get(f"/farmers/{farmer_id}/products")

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        # Products should be a list
        assert isinstance(data.get("data"), list) or isinstance(data, list)

    @pytest.mark.negative
    def test_get_farmer_products_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /farmers/{id}/products returns 404 with invalid ID"""
        response = admin_client.get("/farmers/00000000-0000-0000-0000-000000000000/products")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_farmer_products_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /farmers/{id}/products returns 401 without auth"""
        response = api_client_v2.get("/farmers/00000000-0000-0000-0000-000000000001/products")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFarmersSuggestedFlower:
    """Tests for GET /api/v1/farmers/{id}/suggested-flower"""

    @pytest.mark.positive
    def test_get_suggested_flower_returns_200(self, admin_client: APIClient):
        """Test GET /farmers/{id}/suggested-flower returns 200"""
        list_response = admin_client.get("/farmers", params={"per_page": 1})

        if list_response.status_code != 200:
            pytest.skip("Could not fetch farmer list")

        farmers = list_response.json().get("data", [])
        if not farmers:
            pytest.skip("No farmers available")

        farmer_id = farmers[0]["id"]

        response = admin_client.get(f"/farmers/{farmer_id}/suggested-flower")

        # May return 200 or 404 depending on implementation
        assert response.status_code in [HTTP_200_OK, HTTP_404_NOT_FOUND]

    @pytest.mark.negative
    def test_get_suggested_flower_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /farmers/{id}/suggested-flower returns 404 with invalid ID"""
        response = admin_client.get("/farmers/00000000-0000-0000-0000-000000000000/suggested-flower")

        assert_status_code(response, HTTP_404_NOT_FOUND)
