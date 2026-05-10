"""
Tests for Time Slots Endpoints

This module contains tests for the /api/v1/time-slots endpoints including:
- GET /time-slots - List all time slots
- GET /time-slots/active - List active time slots
- GET /time-slots/{id} - Get time slot by ID
- POST /time-slots - Create time slot
- PUT /time-slots/{id} - Update time slot
- DELETE /time-slots/{id} - Soft delete time slot
- PATCH /time-slots/{id}/deactivate - Deactivate time slot
- PATCH /time-slots/{id}/activate - Activate time slot
"""

import pytest
import uuid

from tests.utils.api_client import APIClient
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_paginated_response,
)
from tests.conftest import UNAUTH_STATUS
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
)


class TestTimeSlotsList:
    """Tests for GET /api/v1/time-slots"""

    @pytest.mark.positive
    def test_list_time_slots_returns_200(self, admin_client: APIClient):
        """Test GET /time-slots returns 200 with paginated list"""
        response = admin_client.get("/time-slots")

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        assert "pagination" in data
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_time_slots_with_pagination(self, admin_client: APIClient):
        """Test GET /time-slots with pagination parameters"""
        response = admin_client.get("/time-slots", params={"page": 1, "per_page": 5})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 5

    @pytest.mark.positive
    def test_list_time_slots_with_search(self, admin_client: APIClient):
        """Test GET /time-slots with search parameter"""
        response = admin_client.get("/time-slots", params={"search": "morning"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_time_slots_staff_access(self, staff_client: APIClient):
        """Test GET /time-slots returns 200 for staff users"""
        response = staff_client.get("/time-slots")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_list_time_slots_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /time-slots returns 401 without authentication"""
        response = api_client_v2.get("/time-slots")

        assert_status_code(response, UNAUTH_STATUS)


class TestTimeSlotsActive:
    """Tests for GET /api/v1/time-slots/active"""

    @pytest.mark.positive
    def test_list_active_time_slots_returns_200(self, admin_client: APIClient):
        """Test GET /time-slots/active returns 200 with active slots"""
        response = admin_client.get("/time-slots/active")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert isinstance(data["data"], list)


class TestTimeSlotsGet:
    """Tests for GET /api/v1/time-slots/{id}"""

    @pytest.mark.positive
    def test_get_time_slot_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /time-slots/{id} returns 200 with time slot details"""
        list_response = admin_client.get("/time-slots", params={"per_page": 1})

        if list_response.status_code != 200:
            pytest.skip("Could not fetch time slots list")

        slots = list_response.json().get("data", [])
        if not slots:
            pytest.skip("No time slots available")

        slot_id = slots[0]["id"]

        response = admin_client.get(f"/time-slots/{slot_id}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["id"] == slot_id

    @pytest.mark.negative
    def test_get_time_slot_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /time-slots/{id} returns 404 with invalid ID"""
        response = admin_client.get("/time-slots/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_time_slot_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /time-slots/{id} returns 401 without auth"""
        response = api_client_v2.get("/time-slots/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, UNAUTH_STATUS)


class TestTimeSlotsCreate:
    """Tests for POST /api/v1/time-slots"""

    @pytest.mark.positive
    def test_create_time_slot_returns_201(self, admin_client: APIClient):
        """Test POST /time-slots returns 201 with valid data"""
        unique_name = f"Test Slot {uuid.uuid4().hex[:6]}"

        response = admin_client.post(
            "/time-slots/",
            params={
                "name": unique_name,
                "name_ta": f"சோதனை {uuid.uuid4().hex[:6]}",
                "start_time": "10:00",
                "end_time": "12:00",
            }
        )

        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"

        data = validate_success_response(response)
        assert data["data"]["name"] == unique_name

        # Cleanup
        slot_id = data["data"]["id"]
        if slot_id:
            admin_client.delete(f"/time-slots/{slot_id}")

    @pytest.mark.negative
    def test_create_time_slot_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /time-slots returns 422 with missing required fields"""
        response = admin_client.post("/time-slots/", params={})

        assert response.status_code in [HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_time_slot_invalid_time_format_returns_400(self, admin_client: APIClient):
        """Test POST /time-slots returns 400 with invalid time format"""
        response = admin_client.post(
            "/time-slots/",
            params={
                "name": "Test",
                "name_ta": "சோதனை",
                "start_time": "invalid",
                "end_time": "12:00",
            }
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_create_time_slot_farmer_forbidden_returns_403(self, farmer_client: APIClient):
        """Test POST /time-slots returns 403 for farmer users"""
        response = farmer_client.post(
            "/time-slots/",
            params={
                "name": "Test",
                "name_ta": "சோதனை",
                "start_time": "10:00",
                "end_time": "12:00",
            }
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestTimeSlotsUpdate:
    """Tests for PUT /api/v1/time-slots/{id}"""

    @pytest.mark.positive
    def test_update_time_slot_returns_200(self, admin_client: APIClient):
        """Test PUT /time-slots/{id} returns 200 with valid data"""
        unique_name = f"Update Slot {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/time-slots/",
            params={"name": unique_name, "name_ta": "சோதனை", "start_time": "10:00", "end_time": "12:00"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create time slot for update test")

        slot_id = create_response.json()["data"]["id"]

        response = admin_client.put(
            f"/time-slots/{slot_id}",
            params={"name": f"Updated {unique_name}"}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "Updated" in data["data"]["name"]

        # Cleanup
        admin_client.delete(f"/time-slots/{slot_id}")

    @pytest.mark.negative
    def test_update_time_slot_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /time-slots/{id} returns 404 with invalid ID"""
        response = admin_client.put(
            "/time-slots/00000000-0000-0000-0000-000000000000",
            params={"name": "Updated"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestTimeSlotsDelete:
    """Tests for DELETE /api/v1/time-slots/{id}"""

    @pytest.mark.positive
    def test_delete_time_slot_returns_200(self, admin_client: APIClient):
        """Test DELETE /time-slots/{id} returns 200"""
        unique_name = f"Delete Slot {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/time-slots/",
            params={"name": unique_name, "name_ta": "சோதனை", "start_time": "10:00", "end_time": "12:00"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create time slot for deletion test")

        slot_id = create_response.json()["data"]["id"]

        response = admin_client.delete(f"/time-slots/{slot_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_time_slot_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /time-slots/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/time-slots/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_time_slot_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /time-slots/{id} returns 403 for staff"""
        response = staff_client.delete("/time-slots/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestTimeSlotsDeactivate:
    """Tests for PATCH /api/v1/time-slots/{id}/deactivate"""

    @pytest.mark.positive
    def test_deactivate_time_slot_returns_200(self, admin_client: APIClient):
        """Test PATCH /time-slots/{id}/deactivate returns 200"""
        unique_name = f"Deact Slot {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/time-slots/",
            params={"name": unique_name, "name_ta": "சோதனை", "start_time": "10:00", "end_time": "12:00"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create time slot for deactivate test")

        slot_id = create_response.json()["data"]["id"]

        response = admin_client.patch(f"/time-slots/{slot_id}/deactivate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is False

        # Cleanup
        admin_client.delete(f"/time-slots/{slot_id}")

    @pytest.mark.negative
    def test_deactivate_time_slot_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /time-slots/{id}/deactivate returns 404"""
        response = admin_client.patch("/time-slots/00000000-0000-0000-0000-000000000000/deactivate")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestTimeSlotsActivate:
    """Tests for PATCH /api/v1/time-slots/{id}/activate"""

    @pytest.mark.positive
    def test_activate_time_slot_returns_200(self, admin_client: APIClient):
        """Test PATCH /time-slots/{id}/activate returns 200"""
        unique_name = f"Act Slot {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/time-slots/",
            params={"name": unique_name, "name_ta": "சோதனை", "start_time": "10:00", "end_time": "12:00"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create time slot for activate test")

        slot_id = create_response.json()["data"]["id"]

        # Deactivate first
        admin_client.patch(f"/time-slots/{slot_id}/deactivate")

        # Now activate
        response = admin_client.patch(f"/time-slots/{slot_id}/activate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is True

        # Cleanup
        admin_client.delete(f"/time-slots/{slot_id}")

    @pytest.mark.negative
    def test_activate_time_slot_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /time-slots/{id}/activate returns 404"""
        response = admin_client.patch("/time-slots/00000000-0000-0000-0000-000000000000/activate")

        assert_status_code(response, HTTP_404_NOT_FOUND)
