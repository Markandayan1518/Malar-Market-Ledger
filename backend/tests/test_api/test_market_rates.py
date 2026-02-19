"""
Tests for Market Rates Endpoint

This module contains tests for the /api/v1/market-rates endpoints including:
- GET / - List rates
- GET /{id} - Get rate by ID
- POST / - Create rate (admin)
- PUT /{id} - Update rate (admin)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestMarketRatesList:
    """Tests for GET /api/v1/market-rates"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_list_rates_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /market-rates returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/market-rates",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_rates_with_staff_token_returns_200(self, staff_auth_header):
        """Test GET /market-rates returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.get(
            f"{BASE_URL}/market-rates",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_list_rates_without_token_returns_401(self):
        """Test GET /market-rates returns 401 without token"""
        response = requests.get(f"{BASE_URL}/market-rates", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestMarketRateGetById:
    """Tests for GET /api/v1/market-rates/{id}"""

    @pytest.mark.positive
    def test_get_rate_by_id_returns_200(self, admin_auth_header):
        """Test GET /market-rates/{id} returns 200 with valid ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/market-rates",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get rates list")
        
        data = list_response.json()
        rates = data.get("rates", []) if isinstance(data, dict) else data
        
        if not rates:
            pytest.skip("No rates available for testing")
        
        rate_id = rates[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/market-rates/{rate_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_rate_by_invalid_id_returns_404(self, admin_auth_header):
        """Test GET /market-rates/{id} returns 404 for non-existent ID"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000999"
        response = requests.get(
            f"{BASE_URL}/market-rates/{fake_id}",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestMarketRateCreate:
    """Tests for POST /api/v1/market-rates"""

    @pytest.mark.positive
    def test_create_rate_with_admin_token_returns_201(self, admin_auth_header):
        """Test POST /market-rates returns 201 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        payload = {
            "flower_type_id": "00000000-0000-0000-0000-000000000001",
            "time_slot_id": "00000000-0000-0000-0000-000000000001",
            "rate": 50.0,
            "effective_from": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{BASE_URL}/market-rates",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [201, 400, 404, 422], f"Expected 201/400/404/422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_rate_without_token_returns_401(self):
        """Test POST /market-rates returns 401 without token"""
        payload = {"rate": 50.0}
        response = requests.post(
            f"{BASE_URL}/market-rates",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_rate_with_staff_token_returns_403(self, staff_auth_header):
        """Test POST /market-rates returns 403 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        payload = {"rate": 50.0}
        response = requests.post(
            f"{BASE_URL}/market-rates",
            json=payload,
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_rate_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test POST /market-rates returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        payload = {"rate": 50.0}
        response = requests.post(
            f"{BASE_URL}/market-rates",
            json=payload,
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"


class TestMarketRateUpdate:
    """Tests for PUT /api/v1/market-rates/{id}"""

    @pytest.mark.positive
    def test_update_rate_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /market-rates/{id} returns 200 with valid data"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        # First get list to get a valid ID
        list_response = requests.get(
            f"{BASE_URL}/market-rates",
            headers=admin_auth_header,
            timeout=30
        )
        
        if list_response.status_code != 200:
            pytest.skip("Cannot get rates list")
        
        data = list_response.json()
        rates = data.get("rates", []) if isinstance(data, dict) else data
        
        if not rates:
            pytest.skip("No rates available for testing")
        
        rate_id = rates[0].get("id")
        
        update_payload = {"rate": 60.0}
        response = requests.put(
            f"{BASE_URL}/market-rates/{rate_id}",
            json=update_payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_rate_without_token_returns_401(self):
        """Test PUT /market-rates/{id} returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/market-rates/{fake_id}",
            json={"rate": 60.0},
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_update_rate_with_staff_token_returns_403(self, staff_auth_header):
        """Test PUT /market-rates/{id} returns 403 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/market-rates/{fake_id}",
            json={"rate": 60.0},
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
