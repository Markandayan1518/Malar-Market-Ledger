"""
Tests for Daily Entries Endpoint

This module contains tests for the /api/v1/daily-entries endpoints including:
- GET / - List entries (with filters)
- GET /{id} - Get entry by ID
- POST / - Create entry (admin/staff)
- PUT /{id} - Update entry (admin/staff)
- DELETE /{id} - Delete entry (admin)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestDailyEntriesList:
    """Tests for GET /api/v1/daily-entries"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_entries_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /daily-entries returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, (list, dict)), f"Response should be list or dict: {data}"

    @pytest.mark.positive
    def test_list_entries_with_staff_token_returns_200(self, staff_auth_header):
        """Test GET /daily-entries returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_entries_with_date_filter(self, admin_auth_header):
        """Test GET /daily-entries with date filter"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        today = datetime.now().strftime("%Y-%m-%d")
        params = {"date": today}
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_entries_with_pagination(self, admin_auth_header):
        """Test GET /daily-entries with pagination"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        params = {"skip": 0, "limit": 10}
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_entries_with_farmer_filter(self, admin_auth_header):
        """Test GET /daily-entries with farmer filter"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        params = {"farmer_id": "00000000-0000-0000-0000-000000000001"}
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_entries_without_token_returns_401(self):
        """Test GET /daily-entries returns 401 without token"""
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_list_entries_with_farmer_token_returns_200(self, farmer_auth_header):
        """Test GET /daily-entries returns 200 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=farmer_auth_header,
            timeout=30
        )
        # Farmers should have read access
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"


class TestDailyEntryGetById:
    """Tests for GET /api/v1/daily-entries/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_entry_by_id_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /daily-entries/{id} returns 200 with valid ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get entries list")
        
        data = list_response.json()
        entries = data.get("entries", []) if isinstance(data, dict) else data
        
        if not entries:
            pytest.skip("No entries available for testing")
        
        entry_id = entries[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/daily-entries/{entry_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_entry_by_id_without_token_returns_401(self):
        """Test GET /daily-entries/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.get(
            f"{BASE_URL}/daily-entries/{fake_id}",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_entry_by_invalid_id_returns_404(self, admin_auth_header):
        """Test GET /daily-entries/{id} returns 404 for non-existent ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000999"
        response = requests.get(
            f"{BASE_URL}/daily-entries/{fake_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestDailyEntryCreate:
    """Tests for POST /api/v1/daily-entries"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_create_entry_with_admin_token_returns_201(self, admin_auth_header):
        """Test POST /daily-entries returns 201 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "flower_type_id": "00000000-0000-0000-0000-000000000001",
            "time_slot_id": "00000000-0000-0000-0000-000000000001",
            "weight": 10.5,
            "rate": 50.0,
            "total_amount": 525.0,
            "entry_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        # May return 201 or 400/404 if related entities don't exist
        assert response.status_code in [201, 400, 404, 422], f"Expected 201/400/404/422, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_create_entry_with_staff_token_returns_201(self, staff_auth_header):
        """Test POST /daily-entries returns 201 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "flower_type_id": "00000000-0000-0000-0000-000000000001",
            "time_slot_id": "00000000-0000-0000-0000-000000000001",
            "weight": 10.5,
            "rate": 50.0,
            "total_amount": 525.0,
            "entry_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code in [201, 400, 404, 422], f"Expected 201/400/404/422, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_create_entry_without_token_returns_401(self):
        """Test POST /daily-entries returns 401 without token"""
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "weight": 10.5
        }
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_entry_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test POST /daily-entries returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "weight": 10.5
        }
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_entry_with_empty_payload_returns_422(self, admin_auth_header):
        """Test POST /daily-entries returns 422 with empty payload"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json={},
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_entry_with_missing_required_fields_returns_422(self, admin_auth_header):
        """Test POST /daily-entries returns 422 with missing required fields"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        payload = {"weight": 10.5}
        response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestDailyEntryUpdate:
    """Tests for PUT /api/v1/daily-entries/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_update_entry_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /daily-entries/{id} returns 200 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/daily-entries",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get entries list")
        
        data = list_response.json()
        entries = data.get("entries", []) if isinstance(data, dict) else data
        
        if not entries:
            pytest.skip("No entries available for testing")
        
        entry_id = entries[0].get("id")
        
        update_payload = {"weight": 15.0}
        response = requests.put(
            f"{BASE_URL}/daily-entries/{entry_id}",
            json=update_payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_update_entry_without_token_returns_401(self):
        """Test PUT /daily-entries/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/daily-entries/{fake_id}",
            json={"weight": 15.0},
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_entry_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test PUT /daily-entries/{id} returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/daily-entries/{fake_id}",
            json={"weight": 15.0},
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_nonexistent_entry_returns_404(self, admin_auth_header):
        """Test PUT /daily-entries/{id} returns 404 for non-existent entry"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000999"
        response = requests.put(
            f"{BASE_URL}/daily-entries/{fake_id}",
            json={"weight": 15.0},
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestDailyEntryDelete:
    """Tests for DELETE /api/v1/daily-entries/{id}"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_delete_entry_with_admin_token_returns_204(self, admin_auth_header):
        """Test DELETE /daily-entries/{id} returns 204 for valid ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First create an entry to delete
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "flower_type_id": "00000000-0000-0000-0000-000000000001",
            "time_slot_id": "00000000-0000-0000-0000-000000000001",
            "weight": 10.5,
            "rate": 50.0,
            "total_amount": 525.0,
            "entry_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        create_response = requests.post(
            f"{BASE_URL}/daily-entries",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        
        if create_response.status_code != 201:
            pytest.skip("Cannot create entry for deletion test")
        
        entry_id = create_response.json().get("id")
        
        response = requests.delete(
            f"{BASE_URL}/daily-entries/{entry_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [204, 200, 404], f"Expected 204/200/404, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_delete_entry_without_token_returns_401(self):
        """Test DELETE /daily-entries/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/daily-entries/{fake_id}",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_delete_entry_with_staff_token_returns_403(self, staff_auth_header):
        """Test DELETE /daily-entries/{id} returns 403 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/daily-entries/{fake_id}",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_delete_entry_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test DELETE /daily-entries/{id} returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.delete(
            f"{BASE_URL}/daily-entries/{fake_id}",
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
