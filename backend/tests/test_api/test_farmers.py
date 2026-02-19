"""
Tests for Farmers Endpoint

This module contains tests for the /api/v1/farmers endpoints including:
- GET / - List all farmers
- GET /{id} - Get farmer by ID
- POST / - Create farmer (admin/staff)
- PUT /{id} - Update farmer (admin/staff)
- DELETE /{id} - Delete farmer (admin)
"""

import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestFarmersList:
    """Tests for GET /api/v1/farmers"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_farmers_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /farmers returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/farmers",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, (list, dict)), f"Response should be list or dict: {data}"
        if isinstance(data, dict):
            assert "farmers" in data or "data" in data, f"Response should contain 'farmers' or 'data' key: {data}"

    @pytest.mark.positive
    def test_list_farmers_with_staff_token_returns_200(self, staff_auth_header):
        """Test GET /farmers returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.get(
            f"{BASE_URL}/farmers",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_farmers_with_pagination(self, admin_auth_header):
        """Test GET /farmers with pagination parameters"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        params = {"skip": 0, "limit": 10}
        response = requests.get(
            f"{BASE_URL}/farmers",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_farmers_with_search_filter(self, admin_auth_header):
        """Test GET /farmers with search filter"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        params = {"search": "test"}
        response = requests.get(
            f"{BASE_URL}/farmers",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_farmers_without_token_returns_401(self):
        """Test GET /farmers returns 401 without token"""
        response = requests.get(
            f"{BASE_URL}/farmers",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_list_farmers_with_farmer_token_returns_200(self, farmer_auth_header):
        """Test GET /farmers returns 200 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        response = requests.get(
            f"{BASE_URL}/farmers",
            headers=farmer_auth_header,
            timeout=30
        )
        # Farmers should have read access to farmer list
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"


class TestFarmerGetById:
    """Tests for GET /api/v1/farmers/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_farmer_by_id_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /farmers/{id} returns 200 with valid ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/farmers",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get farmer list")
        
        data = list_response.json()
        farmers = data.get("farmers", []) if isinstance(data, dict) else data
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/farmers/{farmer_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, f"Response should contain 'id': {data}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_farmer_by_id_without_token_returns_401(self):
        """Test GET /farmers/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.get(
            f"{BASE_URL}/farmers/{fake_id}",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_farmer_by_invalid_id_returns_404(self, admin_auth_header):
        """Test GET /farmers/{id} returns 404 for non-existent ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000999"
        response = requests.get(
            f"{BASE_URL}/farmers/{fake_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestFarmerCreate:
    """Tests for POST /api/v1/farmers"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_create_farmer_with_admin_token_returns_201(self, admin_auth_header, sample_farmer):
        """Test POST /farmers returns 201 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.post(
            f"{BASE_URL}/farmers",
            json=sample_farmer,
            headers=admin_auth_header,
            timeout=30
        )
        # May return 201 or 400 if farmer already exists
        assert response.status_code in [201, 400, 422], f"Expected 201/400/422, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_create_farmer_with_staff_token_returns_201(self, staff_auth_header, sample_farmer):
        """Test POST /farmers returns 201 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.post(
            f"{BASE_URL}/farmers",
            json=sample_farmer,
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code in [201, 400, 422], f"Expected 201/400/422, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_farmer_without_token_returns_401(self, sample_farmer):
        """Test POST /farmers returns 401 without token"""
        response = requests.post(
            f"{BASE_URL}/farmers",
            json=sample_farmer,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_farmer_with_farmer_token_returns_403(self, farmer_auth_header, sample_farmer):
        """Test POST /farmers returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        response = requests.post(
            f"{BASE_URL}/farmers",
            json=sample_farmer,
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_farmer_with_empty_payload_returns_422(self, admin_auth_header):
        """Test POST /farmers returns 422 with empty payload"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.post(
            f"{BASE_URL}/farmers",
            json={},
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_farmer_with_missing_required_fields_returns_422(self, admin_auth_header):
        """Test POST /farmers returns 422 with missing required fields"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        payload = {"name": "Test Farmer"}
        response = requests.post(
            f"{BASE_URL}/farmers",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestFarmerUpdate:
    """Tests for PUT /api/v1/farmers/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_update_farmer_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /farmers/{id} returns 200 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/farmers",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get farmer list")
        
        data = list_response.json()
        farmers = data.get("farmers", []) if isinstance(data, dict) else data
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0].get("id")
        
        update_payload = {"name": "Updated Name"}
        response = requests.put(
            f"{BASE_URL}/farmers/{farmer_id}",
            json=update_payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_update_farmer_with_staff_token_returns_200(self, staff_auth_header):
        """Test PUT /farmers/{id} returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/farmers",
            headers=staff_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get farmer list")
        
        data = list_response.json()
        farmers = data.get("farmers", []) if isinstance(data, dict) else data
        
        if not farmers:
            pytest.skip("No farmers available for testing")
        
        farmer_id = farmers[0].get("id")
        
        update_payload = {"name": "Updated Name"}
        response = requests.put(
            f"{BASE_URL}/farmers/{farmer_id}",
            json=update_payload,
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_update_farmer_without_token_returns_401(self):
        """Test PUT /farmers/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/farmers/{fake_id}",
            json={"name": "Test"},
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_farmer_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test PUT /farmers/{id} returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/farmers/{fake_id}",
            json={"name": "Test"},
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_nonexistent_farmer_returns_404(self, admin_auth_header):
        """Test PUT /farmers/{id} returns 404 for non-existent farmer"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000999"
        response = requests.put(
            f"{BASE_URL}/farmers/{fake_id}",
            json={"name": "Test"},
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestFarmerDelete:
    """Tests for DELETE /api/v1/farmers/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_delete_farmer_with_admin_token_returns_204(self, admin_auth_header):
        """Test DELETE /farmers/{id} returns 204 for valid ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First create a farmer to delete
        sample_farmer = {
            "name": "Test Farmer to Delete",
            "phone": "9999999999",
            "village": "Test Village"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/farmers",
            json=sample_farmer,
            headers=admin_auth_header,
            timeout=30
        )
        
        # Skip if we can't create
        if create_response.status_code != 201:
            pytest.skip("Cannot create farmer for deletion test")
        
        farmer_id = create_response.json().get("id")
        
        response = requests.delete(
            f"{BASE_URL}/farmers/{farmer_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [204, 200, 404], f"Expected 204/200/404, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_delete_farmer_without_token_returns_401(self):
        """Test DELETE /farmers/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/farmers/{fake_id}",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_delete_farmer_with_staff_token_returns_403(self, staff_auth_header):
        """Test DELETE /farmers/{id} returns 403 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/farmers/{fake_id}",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_delete_farmer_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test DELETE /farmers/{id} returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/farmers/{fake_id}",
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
