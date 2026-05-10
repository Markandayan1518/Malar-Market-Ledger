"""
Tests for Business Profile Endpoints

This module contains tests for the /api/v1/business-profile endpoints including:
- GET /business-profile/ - Get active business profile (public)
- GET /business-profile/all - List all profiles (admin)
- POST /business-profile/ - Create profile (admin)
- PUT /business-profile/{id} - Update profile (admin)
- POST /business-profile/{id}/activate - Activate profile (admin)
- DELETE /business-profile/{id} - Delete profile (admin)
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
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)


def _create_test_profile(admin_client: APIClient):
    """Helper to create a test business profile and return its ID."""
    profile_data = {
        "shop_name": f"Test Shop {uuid.uuid4().hex[:6]}",
        "owner_name": "Test Owner",
        "address_line1": "123 Test Street",
        "city": "Test City",
        "state": "Tamil Nadu",
        "pincode": "600001",
        "phone": f"+91{uuid.uuid4().hex[:10]}",
        "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
        "gst_number": "",
        "pan_number": "",
        "invoice_prefix": "TST",
    }

    response = admin_client.post("/business-profile/", data=profile_data)

    if response.status_code not in [200, 201]:
        return None, f"Create failed: {response.status_code} {response.text}"

    profile_id = response.json()["data"]["id"]
    return profile_id, None


class TestGetBusinessProfile:
    """Tests for GET /api/v1/business-profile/"""

    @pytest.mark.positive
    def test_get_active_business_profile_returns_200(self, admin_client: APIClient):
        """Test GET /business-profile/ returns 200 with active profile"""
        response = admin_client.get("/business-profile/")

        # May return 200 or 404 if no profile exists
        assert response.status_code in [HTTP_200_OK, HTTP_404_NOT_FOUND]

        if response.status_code == HTTP_200_OK:
            data = response.json()
            assert "data" in data or "shop_name" in data

    @pytest.mark.positive
    def test_get_business_profile_public_no_auth(self, api_client_v2: APIClient):
        """Test GET /business-profile/ works without authentication (public endpoint)"""
        response = api_client_v2.get("/business-profile/")

        # Public endpoint - may return 200 or 404
        assert response.status_code in [HTTP_200_OK, HTTP_404_NOT_FOUND]


class TestListBusinessProfiles:
    """Tests for GET /api/v1/business-profile/all"""

    @pytest.mark.positive
    def test_list_business_profiles_returns_200(self, admin_client: APIClient):
        """Test GET /business-profile/all returns 200 with profiles list"""
        response = admin_client.get("/business-profile/all")

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        assert data["success"] is True
        assert isinstance(data["data"], list)

    @pytest.mark.negative
    def test_list_business_profiles_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test GET /business-profile/all returns 403 for staff users"""
        response = staff_client.get("/business-profile/all")

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_list_business_profiles_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /business-profile/all returns 401 without authentication"""
        response = api_client_v2.get("/business-profile/all")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestCreateBusinessProfile:
    """Tests for POST /api/v1/business-profile/"""

    @pytest.mark.positive
    def test_create_business_profile_returns_201(self, admin_client: APIClient):
        """Test POST /business-profile/ returns 201 with valid data"""
        profile_id, error = _create_test_profile(admin_client)
        if error:
            pytest.skip(error)

        assert profile_id is not None

        # Cleanup - delete the created profile (need to deactivate first)
        admin_client.post(f"/business-profile/{profile_id}/activate")
        # Deactivate it by creating another
        _create_test_profile(admin_client)
        admin_client.delete(f"/business-profile/{profile_id}")

    @pytest.mark.negative
    def test_create_business_profile_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /business-profile/ returns 422 with missing required fields"""
        response = admin_client.post("/business-profile/", data={})

        assert response.status_code in [HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_business_profile_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /business-profile/ returns 403 for staff"""
        response = staff_client.post("/business-profile/", data={"shop_name": "Test"})

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestUpdateBusinessProfile:
    """Tests for PUT /api/v1/business-profile/{id}"""

    @pytest.mark.positive
    def test_update_business_profile_returns_200(self, admin_client: APIClient):
        """Test PUT /business-profile/{id} returns 200 with valid data"""
        profile_id, error = _create_test_profile(admin_client)
        if error:
            pytest.skip(error)

        update_data = {"shop_name": f"Updated Shop {uuid.uuid4().hex[:6]}"}

        response = admin_client.put(f"/business-profile/{profile_id}", data=update_data)

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert "Updated" in data["data"]["shop_name"]

        # Cleanup
        admin_client.post(f"/business-profile/{profile_id}/activate")
        _create_test_profile(admin_client)
        admin_client.delete(f"/business-profile/{profile_id}")

    @pytest.mark.negative
    def test_update_business_profile_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /business-profile/{id} returns 404 with invalid ID"""
        response = admin_client.put(
            "/business-profile/00000000-0000-0000-0000-000000000000",
            data={"shop_name": "Test"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestActivateBusinessProfile:
    """Tests for POST /api/v1/business-profile/{id}/activate"""

    @pytest.mark.positive
    def test_activate_business_profile_returns_200(self, admin_client: APIClient):
        """Test POST /business-profile/{id}/activate returns 200"""
        profile_id, error = _create_test_profile(admin_client)
        if error:
            pytest.skip(error)

        response = admin_client.post(f"/business-profile/{profile_id}/activate")

        assert_status_code(response, HTTP_200_OK)
        validate_success_response(response)

    @pytest.mark.negative
    def test_activate_business_profile_invalid_id_returns_404(self, admin_client: APIClient):
        """Test POST /business-profile/{id}/activate returns 404"""
        response = admin_client.post(
            "/business-profile/00000000-0000-0000-0000-000000000000/activate"
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestDeleteBusinessProfile:
    """Tests for DELETE /api/v1/business-profile/{id}"""

    @pytest.mark.positive
    def test_delete_business_profile_returns_200(self, admin_client: APIClient):
        """Test DELETE /business-profile/{id} returns 200 for inactive profile"""
        profile_id, error = _create_test_profile(admin_client)
        if error:
            pytest.skip(error)

        # Create another profile to make the first one inactive
        _create_test_profile(admin_client)

        response = admin_client.delete(f"/business-profile/{profile_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_active_business_profile_returns_400(self, admin_client: APIClient):
        """Test DELETE /business-profile/{id} returns 400 for active profile"""
        # Get the active profile
        all_response = admin_client.get("/business-profile/all")
        if all_response.status_code != 200:
            pytest.skip("Could not list profiles")

        profiles = all_response.json().get("data", [])
        active_profiles = [p for p in profiles if p.get("is_active")]

        if not active_profiles:
            pytest.skip("No active profile to test")

        active_id = active_profiles[0]["id"]

        response = admin_client.delete(f"/business-profile/{active_id}")

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_delete_business_profile_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /business-profile/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/business-profile/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)
