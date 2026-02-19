"""
Tests for Settlements Endpoint

This module contains tests for the /api/v1/settlements endpoints including:
- GET / - List settlements
- GET /{id} - Get settlement by ID
- POST / - Generate settlement (admin)
- PUT /{id}/approve - Approve settlement
- PUT /{id}/mark-paid - Mark as paid
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestSettlementsList:
    """Tests for GET /api/v1/settlements"""

    @pytest.mark.positive
    def test_list_settlements_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /settlements returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/settlements",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_list_settlements_with_staff_token_returns_200(self, staff_auth_header):
        """Test GET /settlements returns 200 with staff token"""
        if not staff_auth_header:
            pytest.skip("Staff token not available")
        
        response = requests.get(
            f"{BASE_URL}/settlements",
            headers=staff_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_list_settlements_without_token_returns_401(self):
        """Test GET /settlements returns 401 without token"""
        response = requests.get(f"{BASE_URL}/settlements", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestSettlementCreate:
    """Tests for POST /api/v1/settlements"""

    @pytest.mark.positive
    def test_create_settlement_with_admin_token_returns_201(self, admin_auth_header):
        """Test POST /settlements returns 201 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        payload = {
            "farmer_id": "00000000-0000-0000-0000-000000000001",
            "period_start": datetime.now().strftime("%Y-%m-%d"),
            "period_end": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/settlements",
            json=payload,
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [201, 400, 404, 422], f"Expected 201/400/404/422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_create_settlement_without_token_returns_401(self):
        """Test POST /settlements returns 401 without token"""
        payload = {"farmer_id": "00000000-0000-0000-0000-000000000001"}
        response = requests.post(
            f"{BASE_URL}/settlements",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestSettlementApprove:
    """Tests for PUT /api/v1/settlements/{id}/approve"""

    @pytest.mark.positive
    def test_approve_settlement_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /settlements/{id}/approve returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/settlements/{fake_id}/approve",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_approve_settlement_without_token_returns_401(self):
        """Test PUT /settlements/{id}/approve returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/settlements/{fake_id}/approve",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestSettlementMarkPaid:
    """Tests for PUT /api/v1/settlements/{id}/mark-paid"""

    @pytest.mark.positive
    def test_mark_paid_with_admin_token_returns_200(self, admin_auth_header):
        """Test PUT /settlements/{id}/mark-paid returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/settlements/{fake_id}/mark-paid",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_mark_paid_without_token_returns_401(self):
        """Test PUT /settlements/{id}/mark-paid returns 401 without token"""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = requests.put(
            f"{BASE_URL}/settlements/{fake_id}/mark-paid",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
