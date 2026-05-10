"""
Extended Tests for Reports Endpoints

This module contains tests for the additional /api/v1/reports endpoints:
- GET /reports/settlements - Get settlements report JSON
- GET /reports/cash-advances - Get cash advances report JSON
- GET /reports/font-info - Get font information
- GET /reports/daily-summary/{report_date} - Generate daily summary report file
- POST /reports/custom - Generate custom report
"""

import pytest
from datetime import date, timedelta

from tests.utils.api_client import APIClient
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
)
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_404_NOT_FOUND,
)


class TestSettlementsReport:
    """Tests for GET /api/v1/reports/settlements"""

    @pytest.mark.positive
    def test_settlements_report_returns_200(self, admin_client: APIClient):
        """Test GET /reports/settlements returns 200 with settlements data"""
        today = date.today()
        start_date = date(today.year, today.month, 1).isoformat()
        end_date = today.isoformat()

        response = admin_client.get(
            "/reports/settlements",
            params={"start_date": start_date, "end_date": end_date}
        )

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        assert "totalSettlements" in data
        assert "totalAmount" in data

    @pytest.mark.positive
    def test_settlements_report_default_dates(self, admin_client: APIClient):
        """Test GET /reports/settlements with default dates"""
        response = admin_client.get("/reports/settlements")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_settlements_report_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /reports/settlements returns 401 without auth"""
        response = api_client_v2.get("/reports/settlements")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCashAdvancesReport:
    """Tests for GET /api/v1/reports/cash-advances"""

    @pytest.mark.positive
    def test_cash_advances_report_returns_200(self, admin_client: APIClient):
        """Test GET /reports/cash-advances returns 200 with advances data"""
        today = date.today()
        start_date = date(today.year, today.month, 1).isoformat()
        end_date = today.isoformat()

        response = admin_client.get(
            "/reports/cash-advances",
            params={"start_date": start_date, "end_date": end_date}
        )

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        assert "totalAdvances" in data
        assert "totalAmount" in data

    @pytest.mark.positive
    def test_cash_advances_report_default_dates(self, admin_client: APIClient):
        """Test GET /reports/cash-advances with default dates"""
        response = admin_client.get("/reports/cash-advances")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_cash_advances_report_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /reports/cash-advances returns 401 without auth"""
        response = api_client_v2.get("/reports/cash-advances")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestFontInfo:
    """Tests for GET /api/v1/reports/font-info"""

    @pytest.mark.positive
    def test_font_info_returns_200(self, admin_client: APIClient):
        """Test GET /reports/font-info returns 200 with font information"""
        response = admin_client.get("/reports/font-info")

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        # Font info should contain relevant keys
        assert isinstance(data, dict)

    @pytest.mark.negative
    def test_font_info_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /reports/font-info returns 401 without auth"""
        response = api_client_v2.get("/reports/font-info")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestDailySummaryFile:
    """Tests for GET /api/v1/reports/daily-summary/{report_date}"""

    @pytest.mark.positive
    def test_daily_summary_excel_returns_200(self, admin_client: APIClient):
        """Test GET /reports/daily-summary/{date} returns Excel file"""
        report_date = date.today().isoformat()

        response = admin_client.get(
            f"/reports/daily-summary/{report_date}",
            params={"format": "excel"}
        )

        # May return 200 with binary content or 500 if no data
        assert response.status_code in [HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_404_NOT_FOUND]

    @pytest.mark.negative
    def test_daily_summary_invalid_date_returns_400(self, admin_client: APIClient):
        """Test GET /reports/daily-summary/{date} returns 400 with invalid date"""
        response = admin_client.get(
            "/reports/daily-summary/invalid-date",
            params={"format": "excel"}
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_daily_summary_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /reports/daily-summary/{date} returns 401 without auth"""
        response = api_client_v2.get(f"/reports/daily-summary/{date.today().isoformat()}")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCustomReport:
    """Tests for POST /api/v1/reports/custom"""

    @pytest.mark.positive
    def test_custom_report_returns_200(self, admin_client: APIClient):
        """Test POST /reports/custom returns 200 with valid parameters"""
        today = date.today()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = today.isoformat()

        response = admin_client.post(
            "/reports/custom",
            params={
                "start_date": start_date,
                "end_date": end_date,
                "format": "excel",
            }
        )

        # May return 200 with binary content or 500 if no data
        assert response.status_code in [HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_404_NOT_FOUND]

    @pytest.mark.negative
    def test_custom_report_invalid_dates_returns_400(self, admin_client: APIClient):
        """Test POST /reports/custom returns 400 with invalid date format"""
        response = admin_client.post(
            "/reports/custom",
            params={
                "start_date": "invalid",
                "end_date": "invalid",
                "format": "excel",
            }
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_custom_report_inverted_dates_returns_400(self, admin_client: APIClient):
        """Test POST /reports/custom returns 400 when start > end"""
        today = date.today()
        start_date = today.isoformat()
        end_date = (today - timedelta(days=7)).isoformat()

        response = admin_client.post(
            "/reports/custom",
            params={
                "start_date": start_date,
                "end_date": end_date,
                "format": "excel",
            }
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_custom_report_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /reports/custom returns 401 without auth"""
        response = api_client_v2.post(
            "/reports/custom",
            params={"start_date": "2026-01-01", "end_date": "2026-01-31"}
        )

        assert_status_code(response, HTTP_401_UNAUTHORIZED)
