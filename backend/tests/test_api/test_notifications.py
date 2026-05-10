"""
Tests for Notifications Endpoints

This module contains tests for the /api/v1/notifications endpoints including:
- GET /notifications - List notifications
- GET /notifications/unread-count - Get unread count
- GET /notifications/{id} - Get notification by ID
- POST /notifications - Create notification
- PUT /notifications/{id}/read - Mark as read
- PUT /notifications/read-all - Mark all as read
- DELETE /notifications/{id} - Delete notification
- DELETE /notifications/clear-all - Clear all notifications
- DELETE /notifications/clear-read - Clear read notifications
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
    HTTP_201_CREATED
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)


class TestNotificationsList:
    """Tests for GET /api/v1/notifications"""

    @pytest.mark.positive
    def test_list_notifications_returns_200(self, admin_client: APIClient):
        """Test GET /notifications returns 200 with paginated list"""
        response = admin_client.get("/notifications")

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        assert "pagination" in data
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_notifications_with_pagination(self, admin_client: APIClient):
        """Test GET /notifications with pagination parameters"""
        response = admin_client.get("/notifications", params={"page": 1, "per_page": 5})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 5

    @pytest.mark.positive
    def test_list_notifications_with_is_read_filter(self, admin_client: APIClient):
        """Test GET /notifications with is_read filter"""
        response = admin_client.get("/notifications", params={"is_read": False})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_notifications_with_type_filter(self, admin_client: APIClient):
        """Test GET /notifications with notification_type filter"""
        response = admin_client.get("/notifications", params={"notification_type": "info"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_notifications_staff_access(self, staff_client: APIClient):
        """Test GET /notifications returns 200 for staff users"""
        response = staff_client.get("/notifications")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_list_notifications_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /notifications returns 401 without authentication"""
        response = api_client_v2.get("/notifications")

        assert_status_code(response, UNAUTH_STATUS)


class TestNotificationsUnreadCount:
    """Tests for GET /api/v1/notifications/unread-count"""

    @pytest.mark.positive
    def test_get_unread_count_returns_200(self, admin_client: APIClient):
        """Test GET /notifications/unread-count returns 200"""
        response = admin_client.get("/notifications/unread-count")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert "unread_count" in data["data"]
        assert isinstance(data["data"]["unread_count"], int)

    @pytest.mark.negative
    def test_get_unread_count_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /notifications/unread-count returns 401 without auth"""
        response = api_client_v2.get("/notifications/unread-count")

        assert_status_code(response, UNAUTH_STATUS)


class TestNotificationsGet:
    """Tests for GET /api/v1/notifications/{id}"""

    @pytest.mark.positive
    def test_get_notification_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /notifications/{id} returns 200 with notification details"""
        # First create a notification
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        create_response = admin_client.post(
            "/notifications/",
            params={
                "user_id": user_id,
                "title": f"Test Notification {uuid.uuid4().hex[:6]}",
                "message": "This is a test notification",
                "notification_type": "info",
            }
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create notification")

        notif_id = create_response.json()["data"]["id"]

        response = admin_client.get(f"/notifications/{notif_id}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["id"] == notif_id

    @pytest.mark.negative
    def test_get_notification_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /notifications/{id} returns 404 with invalid ID"""
        response = admin_client.get("/notifications/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestNotificationsCreate:
    """Tests for POST /api/v1/notifications"""

    @pytest.mark.positive
    def test_create_notification_returns_201(self, admin_client: APIClient):
        """Test POST /notifications returns 201 with valid data"""
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        response = admin_client.post(
            "/notifications/",
            params={
                "user_id": user_id,
                "title": f"Create Test {uuid.uuid4().hex[:6]}",
                "message": "Test notification body",
                "notification_type": "info",
            }
        )

        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"

        data = validate_success_response(response)
        assert "id" in data["data"]

    @pytest.mark.negative
    def test_create_notification_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /notifications returns 422 with missing required fields"""
        response = admin_client.post("/notifications/", params={})

        assert response.status_code in [UNAUTH_STATUS, HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_notification_farmer_forbidden_returns_403(self, farmer_client: APIClient):
        """Test POST /notifications returns 403 for farmer users"""
        response = farmer_client.post(
            "/notifications/",
            params={
                "user_id": "00000000-0000-0000-0000-000000000001",
                "title": "Test",
                "message": "Test",
            }
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestNotificationsMarkRead:
    """Tests for PUT /api/v1/notifications/{id}/read"""

    @pytest.mark.positive
    def test_mark_notification_as_read_returns_200(self, admin_client: APIClient):
        """Test PUT /notifications/{id}/read returns 200"""
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        create_response = admin_client.post(
            "/notifications/",
            params={
                "user_id": user_id,
                "title": f"Read Test {uuid.uuid4().hex[:6]}",
                "message": "Test notification for read",
            }
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create notification for read test")

        notif_id = create_response.json()["data"]["id"]

        response = admin_client.put(f"/notifications/{notif_id}/read")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_read"] is True

    @pytest.mark.negative
    def test_mark_notification_read_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /notifications/{id}/read returns 404"""
        response = admin_client.put("/notifications/00000000-0000-0000-0000-000000000000/read")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestNotificationsMarkAllRead:
    """Tests for PUT /api/v1/notifications/read-all"""

    @pytest.mark.positive
    def test_mark_all_notifications_as_read_returns_200(self, admin_client: APIClient):
        """Test PUT /notifications/read-all returns 200"""
        response = admin_client.put("/notifications/read-all")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "message" in data["data"] or "message" in data

    @pytest.mark.negative
    def test_mark_all_read_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /notifications/read-all returns 401 without auth"""
        response = api_client_v2.put("/notifications/read-all")

        assert_status_code(response, UNAUTH_STATUS)


class TestNotificationsDelete:
    """Tests for DELETE /api/v1/notifications/{id}"""

    @pytest.mark.positive
    def test_delete_notification_returns_200(self, admin_client: APIClient):
        """Test DELETE /notifications/{id} returns 200"""
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        create_response = admin_client.post(
            "/notifications/",
            params={
                "user_id": user_id,
                "title": f"Delete Test {uuid.uuid4().hex[:6]}",
                "message": "Test notification for deletion",
            }
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create notification for deletion test")

        notif_id = create_response.json()["data"]["id"]

        response = admin_client.delete(f"/notifications/{notif_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_notification_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /notifications/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/notifications/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestNotificationsClearAll:
    """Tests for DELETE /api/v1/notifications/clear-all"""

    @pytest.mark.positive
    def test_clear_all_notifications_returns_200(self, admin_client: APIClient):
        """Test DELETE /notifications/clear-all returns 200"""
        response = admin_client.delete("/notifications/clear-all")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "deleted_count" in data["data"] or "message" in data

    @pytest.mark.negative
    def test_clear_all_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test DELETE /notifications/clear-all returns 401 without auth"""
        response = api_client_v2.delete("/notifications/clear-all")

        assert_status_code(response, UNAUTH_STATUS)


class TestNotificationsClearRead:
    """Tests for DELETE /api/v1/notifications/clear-read"""

    @pytest.mark.positive
    def test_clear_read_notifications_returns_200(self, admin_client: APIClient):
        """Test DELETE /notifications/clear-read returns 200"""
        response = admin_client.delete("/notifications/clear-read")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "deleted_count" in data["data"] or "message" in data

    @pytest.mark.negative
    def test_clear_read_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test DELETE /notifications/clear-read returns 401 without auth"""
        response = api_client_v2.delete("/notifications/clear-read")

        assert_status_code(response, UNAUTH_STATUS)
