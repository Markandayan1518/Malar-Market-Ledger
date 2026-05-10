"""
Tests for Users Endpoints

This module contains tests for the /api/v1/users endpoints including:
- GET /users/me - Get current user info
- PUT /users/me - Update current user profile
- PUT /users/me/password - Change password
- GET /users/me/preferences - Get preferences
- PUT /users/me/preferences - Update preferences
- GET /users/ - List all users (admin)
- GET /users/{user_id} - Get user by ID (admin)
- POST /users/ - Create user (admin)
- PUT /users/{user_id} - Update user (admin)
- DELETE /users/{user_id} - Soft delete user (admin)
- POST /users/{user_id}/reset-password - Reset password (admin)

Uses APIClient with JWT auth and response validators.
"""

import pytest
import uuid
import os

from tests.utils.api_client import APIClient, AuthenticationError
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_error_response,
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

TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malar.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff1@malar.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")


class TestGetCurrentUser:
    """Tests for GET /api/v1/users/me"""

    @pytest.mark.positive
    def test_get_current_user_info_returns_200(self, admin_client: APIClient):
        """Test GET /users/me returns 200 with current user info"""
        response = admin_client.get("/users/me")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert "id" in data["data"]
        assert "email" in data["data"]
        assert "full_name" in data["data"]
        assert "role" in data["data"]

    @pytest.mark.positive
    def test_get_current_user_staff_access(self, staff_client: APIClient):
        """Test GET /users/me returns 200 for staff users"""
        response = staff_client.get("/users/me")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["role"] in ["staff", "admin"]

    @pytest.mark.negative
    def test_get_current_user_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /users/me returns 401 without authentication"""
        response = api_client_v2.get("/users/me")

        assert_status_code(response, UNAUTH_STATUS)


class TestUpdateCurrentUser:
    """Tests for PUT /api/v1/users/me"""

    @pytest.mark.positive
    def test_update_current_user_name_returns_200(self, admin_client: APIClient):
        """Test PUT /users/me with full_name returns 200"""
        response = admin_client.put("/users/me", params={"full_name": "Updated Admin Name"})

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["full_name"] == "Updated Admin Name"

    @pytest.mark.positive
    def test_update_current_user_language_returns_200(self, admin_client: APIClient):
        """Test PUT /users/me with language_preference returns 200"""
        response = admin_client.put("/users/me", params={"language_preference": "ta"})

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["language_preference"] == "ta"

    @pytest.mark.negative
    def test_update_current_user_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /users/me returns 401 without authentication"""
        response = api_client_v2.put("/users/me", params={"full_name": "Test"})

        assert_status_code(response, UNAUTH_STATUS)


class TestChangePassword:
    """Tests for PUT /api/v1/users/me/password"""

    @pytest.mark.positive
    def test_change_password_returns_200(self, admin_client: APIClient):
        """Test PUT /users/me/password returns 200 with correct current password"""
        response = admin_client.put(
            "/users/me/password",
            params={"current_password": TEST_ADMIN_PASSWORD, "new_password": "newAdminPass123"}
        )

        assert_status_code(response, HTTP_200_OK)
        validate_success_response(response)

        # Restore original password
        admin_client.put(
            "/users/me/password",
            params={"current_password": "newAdminPass123", "new_password": TEST_ADMIN_PASSWORD}
        )

    @pytest.mark.negative
    def test_change_password_wrong_current_returns_400(self, admin_client: APIClient):
        """Test PUT /users/me/password returns 400 with wrong current password"""
        response = admin_client.put(
            "/users/me/password",
            params={"current_password": "wrongPassword", "new_password": "newPass123"}
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_change_password_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test PUT /users/me/password returns 401 without authentication"""
        response = api_client_v2.put(
            "/users/me/password",
            params={"current_password": "test", "new_password": "test123"}
        )

        assert_status_code(response, UNAUTH_STATUS)


class TestUserPreferences:
    """Tests for GET/PUT /api/v1/users/me/preferences"""

    @pytest.mark.positive
    def test_get_preferences_returns_200(self, admin_client: APIClient):
        """Test GET /users/me/preferences returns 200"""
        response = admin_client.get("/users/me/preferences")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "language" in data["data"]
        assert "theme" in data["data"]

    @pytest.mark.positive
    def test_update_preferences_returns_200(self, admin_client: APIClient):
        """Test PUT /users/me/preferences returns 200"""
        response = admin_client.put(
            "/users/me/preferences",
            params={"language": "ta", "theme": "warm"}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["language"] == "ta"
        assert data["data"]["theme"] == "warm"

    @pytest.mark.negative
    def test_get_preferences_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /users/me/preferences returns 401 without auth"""
        response = api_client_v2.get("/users/me/preferences")

        assert_status_code(response, UNAUTH_STATUS)


class TestListUsers:
    """Tests for GET /api/v1/users/"""

    @pytest.mark.positive
    def test_list_users_returns_200(self, admin_client: APIClient):
        """Test GET /users/ returns 200 with paginated user list"""
        response = admin_client.get("/users/")

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        assert "pagination" in data
        assert "data" in data
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_users_with_pagination(self, admin_client: APIClient):
        """Test GET /users/ with pagination parameters"""
        response = admin_client.get("/users/", params={"page": 1, "per_page": 5})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 5

    @pytest.mark.positive
    def test_list_users_with_search(self, admin_client: APIClient):
        """Test GET /users/ with search parameter"""
        response = admin_client.get("/users/", params={"search": "admin"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_users_with_role_filter(self, admin_client: APIClient):
        """Test GET /users/ with role filter"""
        response = admin_client.get("/users/", params={"role": "admin"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.negative
    def test_list_users_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test GET /users/ returns 403 for staff users"""
        response = staff_client.get("/users/")

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_list_users_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /users/ returns 401 without authentication"""
        response = api_client_v2.get("/users/")

        assert_status_code(response, UNAUTH_STATUS)


class TestGetUser:
    """Tests for GET /api/v1/users/{user_id}"""

    @pytest.mark.positive
    def test_get_user_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /users/{id} returns 200 with user details"""
        # Get admin user ID from /users/me
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        response = admin_client.get(f"/users/{user_id}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["id"] == user_id

    @pytest.mark.negative
    def test_get_user_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /users/{id} returns 404 with invalid ID"""
        response = admin_client.get("/users/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_user_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test GET /users/{id} returns 403 for staff users"""
        response = staff_client.get("/users/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestCreateUser:
    """Tests for POST /api/v1/users/"""

    @pytest.mark.positive
    def test_create_user_returns_201(self, admin_client: APIClient):
        """Test POST /users/ returns 201 with valid data"""
        unique_email = f"testuser_{uuid.uuid4().hex[:8]}@test.com"

        response = admin_client.post(
            "/users/",
            params={
                "email": unique_email,
                "password": "testPassword123",
                "full_name": "Test User",
                "role": "staff",
            }
        )

        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"

        data = validate_success_response(response)
        assert data["data"]["email"] == unique_email

        # Cleanup - delete the created user
        user_id = data["data"]["id"]
        if user_id:
            admin_client.delete(f"/users/{user_id}")

    @pytest.mark.negative
    def test_create_user_duplicate_email_returns_400(self, admin_client: APIClient):
        """Test POST /users/ returns 400 with duplicate email"""
        response = admin_client.post(
            "/users/",
            params={
                "email": TEST_ADMIN_EMAIL,
                "password": "testPassword123",
                "full_name": "Duplicate User",
                "role": "staff",
            }
        )

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_create_user_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /users/ returns 422 with missing required fields"""
        response = admin_client.post("/users/", params={})

        assert response.status_code in [HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_user_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /users/ returns 403 for staff users"""
        response = staff_client.post(
            "/users/",
            params={
                "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
                "password": "testPassword123",
                "full_name": "Test User",
                "role": "staff",
            }
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestUpdateUser:
    """Tests for PUT /api/v1/users/{user_id}"""

    @pytest.mark.positive
    def test_update_user_returns_200(self, admin_client: APIClient):
        """Test PUT /users/{id} returns 200 with valid data"""
        # Get admin user ID
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        response = admin_client.put(
            f"/users/{user_id}",
            params={"full_name": "Updated Name"}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["full_name"] == "Updated Name"

    @pytest.mark.negative
    def test_update_user_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /users/{id} returns 404 with invalid ID"""
        response = admin_client.put(
            "/users/00000000-0000-0000-0000-000000000000",
            params={"full_name": "Test"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_update_user_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test PUT /users/{id} returns 403 for staff users"""
        response = staff_client.put(
            "/users/00000000-0000-0000-0000-000000000001",
            params={"full_name": "Test"}
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestDeleteUser:
    """Tests for DELETE /api/v1/users/{user_id}"""

    @pytest.mark.positive
    def test_delete_user_returns_200(self, admin_client: APIClient):
        """Test DELETE /users/{id} returns 200 for valid user"""
        # Create a user to delete
        unique_email = f"delete_{uuid.uuid4().hex[:8]}@test.com"

        create_response = admin_client.post(
            "/users/",
            params={
                "email": unique_email,
                "password": "testPassword123",
                "full_name": "User to Delete",
                "role": "staff",
            }
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create user for deletion test")

        user_id = create_response.json()["data"]["id"]

        # Delete the user
        response = admin_client.delete(f"/users/{user_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_user_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /users/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/users/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_user_self_returns_400(self, admin_client: APIClient):
        """Test DELETE /users/{id} returns 400 when deleting own account"""
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        response = admin_client.delete(f"/users/{user_id}")

        assert response.status_code == HTTP_400_BAD_REQUEST

    @pytest.mark.negative
    def test_delete_user_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /users/{id} returns 403 for staff users"""
        response = staff_client.delete("/users/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestResetUserPassword:
    """Tests for POST /api/v1/users/{user_id}/reset-password"""

    @pytest.mark.positive
    def test_reset_user_password_returns_200(self, admin_client: APIClient):
        """Test POST /users/{id}/reset-password returns 200"""
        # Get admin user ID
        me_response = admin_client.get("/users/me")
        if me_response.status_code != 200:
            pytest.skip("Could not get current user info")

        user_id = me_response.json()["data"]["id"]

        response = admin_client.post(
            f"/users/{user_id}/reset-password",
            params={"new_password": "resetPassword123"}
        )

        assert_status_code(response, HTTP_200_OK)

        # Restore original password
        admin_client.put(
            "/users/me/password",
            params={"current_password": "resetPassword123", "new_password": TEST_ADMIN_PASSWORD}
        )

    @pytest.mark.negative
    def test_reset_user_password_invalid_id_returns_404(self, admin_client: APIClient):
        """Test POST /users/{id}/reset-password returns 404 with invalid ID"""
        response = admin_client.post(
            "/users/00000000-0000-0000-0000-000000000000/reset-password",
            params={"new_password": "test123"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_reset_user_password_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test POST /users/{id}/reset-password returns 403 for staff"""
        response = staff_client.post(
            "/users/00000000-0000-0000-0000-000000000001/reset-password",
            params={"new_password": "test123"}
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)
