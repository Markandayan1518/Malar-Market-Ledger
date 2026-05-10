"""
Tests for System Settings Endpoints

This module contains tests for the /api/v1/system-settings endpoints including:
- GET /system-settings/ - List all settings (admin)
- GET /system-settings/public - Get public settings
- GET /system-settings/{key} - Get setting by key (admin)
- PUT /system-settings/{key} - Update/create setting (admin)
- DELETE /system-settings/{key} - Delete setting (admin)
- POST /system-settings/bulk - Update multiple settings (admin)
- GET /system-settings/business/profile - Get business profile
- PUT /system-settings/business/profile - Update business profile
"""

import pytest
import uuid

from tests.utils.api_client import APIClient
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
)
from tests.conftest import UNAUTH_STATUS
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_400_BAD_REQUEST
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)


class TestListSettings:
    """Tests for GET /api/v1/system-settings/"""

    @pytest.mark.positive
    def test_list_settings_returns_200(self, admin_client: APIClient):
        """Test GET /system-settings/ returns 200 with settings list"""
        response = admin_client.get("/system-settings/")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert isinstance(data["data"], list)

    @pytest.mark.negative
    def test_list_settings_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test GET /system-settings/ returns 403 for staff users"""
        response = staff_client.get("/system-settings/")

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_list_settings_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /system-settings/ returns 401 without authentication"""
        response = api_client_v2.get("/system-settings/")

        assert_status_code(response, UNAUTH_STATUS)


class TestPublicSettings:
    """Tests for GET /api/v1/system-settings/public"""

    @pytest.mark.positive
    def test_get_public_settings_returns_200(self, admin_client: APIClient):
        """Test GET /system-settings/public returns 200"""
        response = admin_client.get("/system-settings/public")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert isinstance(data["data"], dict)

    @pytest.mark.positive
    def test_get_public_settings_staff_access(self, staff_client: APIClient):
        """Test GET /system-settings/public returns 200 for staff users"""
        response = staff_client.get("/system-settings/public")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_get_public_settings_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /system-settings/public returns 401 without auth"""
        response = api_client_v2.get("/system-settings/public")

        assert_status_code(response, UNAUTH_STATUS)


class TestGetSetting:
    """Tests for GET /api/v1/system-settings/{key}"""

    @pytest.mark.positive
    def test_get_setting_returns_200(self, admin_client: APIClient):
        """Test GET /system-settings/{key} returns 200 for existing key"""
        # First create a setting
        unique_key = f"test_key_{uuid.uuid4().hex[:8]}"
        admin_client.put(f"/system-settings/{unique_key}", params={"value": "test_value"})

        response = admin_client.get(f"/system-settings/{unique_key}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["key"] == unique_key
        assert data["data"]["value"] == "test_value"

        # Cleanup
        admin_client.delete(f"/system-settings/{unique_key}")

    @pytest.mark.negative
    def test_get_setting_nonexistent_key_returns_404(self, admin_client: APIClient):
        """Test GET /system-settings/{key} returns 404 for nonexistent key"""
        response = admin_client.get("/system-settings/nonexistent_key_xyz_123")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_setting_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test GET /system-settings/{key} returns 403 for staff"""
        response = staff_client.get("/system-settings/test_key")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestUpdateSetting:
    """Tests for PUT /api/v1/system-settings/{key}"""

    @pytest.mark.positive
    def test_update_setting_returns_200(self, admin_client: APIClient):
        """Test PUT /system-settings/{key} returns 200"""
        unique_key = f"update_key_{uuid.uuid4().hex[:8]}"

        response = admin_client.put(
            f"/system-settings/{unique_key}",
            params={"value": "initial_value", "description": "Test setting"}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["key"] == unique_key
        assert data["data"]["value"] == "initial_value"

        # Update existing
        response = admin_client.put(
            f"/system-settings/{unique_key}",
            params={"value": "updated_value"}
        )

        assert_status_code(response, HTTP_200_OK)
        assert response.json()["data"]["value"] == "updated_value"

        # Cleanup
        admin_client.delete(f"/system-settings/{unique_key}")

    @pytest.mark.negative
    def test_update_setting_missing_value_returns_422(self, admin_client: APIClient):
        """Test PUT /system-settings/{key} returns error without value"""
        response = admin_client.put(f"/system-settings/test_key_{uuid.uuid4().hex[:8]}", params={})

        assert response.status_code in [UNAUTH_STATUS, HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_update_setting_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /system-settings/{key} returns 403 for staff"""
        response = staff_client.put("/system-settings/test_key", params={"value": "test"})

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestDeleteSetting:
    """Tests for DELETE /api/v1/system-settings/{key}"""

    @pytest.mark.positive
    def test_delete_setting_returns_200(self, admin_client: APIClient):
        """Test DELETE /system-settings/{key} returns 200"""
        unique_key = f"delete_key_{uuid.uuid4().hex[:8]}"
        admin_client.put(f"/system-settings/{unique_key}", params={"value": "to_delete"})

        response = admin_client.delete(f"/system-settings/{unique_key}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_setting_nonexistent_returns_404(self, admin_client: APIClient):
        """Test DELETE /system-settings/{key} returns 404 for nonexistent key"""
        response = admin_client.delete("/system-settings/nonexistent_key_xyz_123")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_setting_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /system-settings/{key} returns 403 for staff"""
        response = staff_client.delete("/system-settings/test_key")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestBulkUpdateSettings:
    """Tests for POST /api/v1/system-settings/bulk"""

    @pytest.mark.positive
    def test_bulk_update_settings_returns_200(self, admin_client: APIClient):
        """Test POST /system-settings/bulk returns 200"""
        unique_prefix = f"bulk_{uuid.uuid4().hex[:6]}"
        settings_data = {
            f"{unique_prefix}_key1": "value1",
            f"{unique_prefix}_key2": "value2",
            f"{unique_prefix}_key3": "value3",
        }

        response = admin_client.post("/system-settings/bulk", data=settings_data)

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "updated_keys" in data["data"] or "message" in data

        # Cleanup
        for key in settings_data:
            admin_client.delete(f"/system-settings/{key}")

    @pytest.mark.negative
    def test_bulk_update_empty_settings_returns_400(self, admin_client: APIClient):
        """Test POST /system-settings/bulk returns 400 with empty settings"""
        response = admin_client.post("/system-settings/bulk", data={})

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_bulk_update_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /system-settings/bulk returns 403 for staff"""
        response = staff_client.post("/system-settings/bulk", data={"key": "value"})

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestBusinessProfile:
    """Tests for GET/PUT /api/v1/system-settings/business/profile"""

    @pytest.mark.positive
    def test_get_business_profile_returns_200(self, admin_client: APIClient):
        """Test GET /system-settings/business/profile returns 200"""
        response = admin_client.get("/system-settings/business/profile")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert isinstance(data["data"], dict)

    @pytest.mark.positive
    def test_update_business_profile_returns_200(self, admin_client: APIClient):
        """Test PUT /system-settings/business/profile returns 200"""
        response = admin_client.put(
            "/system-settings/business/profile",
            params={"business_name": "Test Market", "currency_symbol": "₹"}
        )

        assert_status_code(response, HTTP_200_OK)
        validate_success_response(response)

    @pytest.mark.positive
    def test_get_business_profile_staff_access(self, staff_client: APIClient):
        """Test GET /system-settings/business/profile returns 200 for staff"""
        response = staff_client.get("/system-settings/business/profile")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.positive
    def test_update_business_profile_staff_access(self, staff_client: APIClient):
        """Test PUT /system-settings/business/profile returns 200 for staff"""
        response = staff_client.put(
            "/system-settings/business/profile",
            params={"currency_symbol": "₹"}
        )

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_get_business_profile_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /system-settings/business/profile returns 401 without auth"""
        response = api_client_v2.get("/system-settings/business/profile")

        assert_status_code(response, UNAUTH_STATUS)
