"""
Tests for Reports Endpoint

This module contains tests for the /api/v1/reports endpoints including:
- GET /daily-summary - Daily summary report
- GET /farmer-summary - Farmer summary report
- GET /export/pdf - Export to PDF
- GET /export/excel - Export to Excel
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestReportsDailySummary:
    """Tests for GET /api/v1/reports/daily-summary"""

    @pytest.mark.positive
    def test_get_daily_summary_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /reports/daily-summary returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/reports/daily-summary",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_get_daily_summary_with_date_filter(self, admin_auth_header):
        """Test GET /reports/daily-summary with date filter"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        today = datetime.now().strftime("%Y-%m-%d")
        params = {"date": today}
        response = requests.get(
            f"{BASE_URL}/reports/daily-summary",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_daily_summary_without_token_returns_401(self):
        """Test GET /reports/daily-summary returns 401 without token"""
        response = requests.get(f"{BASE_URL}/reports/daily-summary", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestReportsFarmerSummary:
    """Tests for GET /api/v1/reports/farmer-summary"""

    @pytest.mark.positive
    def test_get_farmer_summary_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /reports/farmer-summary returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/reports/farmer-summary",
            headers=admin_auth_header,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.positive
    def test_get_farmer_summary_with_farmer_id_filter(self, admin_auth_header):
        """Test GET /reports/farmer-summary with farmer_id filter"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        params = {"farmer_id": "00000000-0000-0000-0000-000000000001"}
        response = requests.get(
            f"{BASE_URL}/reports/farmer-summary",
            headers=admin_auth_header,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_farmer_summary_without_token_returns_401(self):
        """Test GET /reports/farmer-summary returns 401 without token"""
        response = requests.get(f"{BASE_URL}/reports/farmer-summary", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestReportsExportPDF:
    """Tests for GET /api/v1/reports/export/pdf"""

    @pytest.mark.positive
    def test_export_pdf_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /reports/export/pdf returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/reports/export/pdf",
            headers=admin_auth_header,
            timeout=60
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_export_pdf_without_token_returns_401(self):
        """Test GET /reports/export/pdf returns 401 without token"""
        response = requests.get(f"{BASE_URL}/reports/export/pdf", timeout=60)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestReportsExportExcel:
    """Tests for GET /api/v1/reports/export/excel"""

    @pytest.mark.positive
    def test_export_excel_with_admin_token_returns_200(self, admin_auth_header):
        """Test GET /reports/export/excel returns 200 with admin token"""
        if not admin_auth_header:
            pytest.skip("Admin token not available")
        
        response = requests.get(
            f"{BASE_URL}/reports/export/excel",
            headers=admin_auth_header,
            timeout=60
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_export_excel_without_token_returns_401(self):
        """Test GET /reports/export/excel returns 401 without token"""
        response = requests.get(f"{BASE_URL}/reports/export/excel", timeout=60)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
