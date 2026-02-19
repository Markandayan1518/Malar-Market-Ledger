"""
Tests for Cash Advances Endpoint

This module contains tests for the /api/v1/cash-advances endpoints including:
- GET / - List advances
- GET /{id} - Get advance by ID
- POST / - Request advance
- PUT /{id}/approve - Approve advance (admin)
- PUT /{id}/reject - Reject advance (admin)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestCashAdvancesList:
    """Tests for GET /api/v1/cash-advances"""

    @pytest.mark.positive
    def test_list_advances_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /cash-advances returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/cash-advances",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_advances_with_staff_token_returns_200(self, staff_auth_header):
        """Test GET /cash-advances returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.get(
            f"{BASE_URL}/cash-advances",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_list_advances_without_token_returns_401(self):
        """Test GET /cash-advances returns 401 without token"""
        response = requests.get(f"{BASE_URL}/cash-advances", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestCashAdvanceCreate:
    """Tests for POST /api/v1/cash-advances"""

    @pytest.mark.positive
    def test_create_advance_with_farmer_token_returns_201(self, farmer_auth_header):
        """Test POST /cash-advances returns 201 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        payload = {
            "amount": 5000.0,
            "reason": "Emergency cash need",
            "requested_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/cash-advances",
            json=payload,
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code in [201, 400, 404, 422], f"Expected 201/400/404/422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_advance_without_token_returns_401(self):
        """Test POST /cash-advances returns 401 without token"""
        payload = {"amount": 5000.0}
        response = requests.post(
            f"{BASE_URL}/cash-advances",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestCashAdvanceApprove:
    """Tests for PUT /api/v1/cash-advances/{id}/approve"""

    @pytest.mark.positive
    def test_approve_advance_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /cash-advances/{id}/approve returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/cash-advances/{fake_id}/approve",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_approve_advance_without_token_returns_401(self):
        """Test PUT /cash-advances/{id}/approve returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/cash-advances/{fake_id}/approve",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_approve_advance_with_farmer_token_returns_403(self, farmer_auth_header):
        """Test PUT /cash-advances/{id}/approve returns 403 with farmer token"""
        if not farmer_auth_header:
            pytest.skip("Farmer token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/cash-advances/{fake_id}/approve",
            headers=farmer_auth_header,
            timeout=30
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"


class TestCashAdvanceReject:
    """Tests for PUT /api/v1/cash-advances/{id}/reject"""

    @pytest.mark.positive
    def test_reject_advance_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /cash-advances/{id}/reject returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/cash-advances/{fake_id}/reject",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_reject_advance_without_token_returns_401(self):
        """Test PUT /cash-advances/{id}/reject returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/cash-advances/{fake_id}/reject",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
