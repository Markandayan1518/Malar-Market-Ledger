"""
Tests for Flower Types Endpoints

This module contains tests for the /api/v1/flower-types endpoints including:
- GET /flower-types - List all flower types
- GET /flower-types/active - List active flower types
- GET /flower-types/{id} - Get flower type by ID
- POST /flower-types - Create flower type
- PUT /flower-types/{id} - Update flower type
- DELETE /flower-types/{id} - Soft delete flower type
- PATCH /flower-types/{id}/deactivate - Deactivate flower type
- PATCH /flower-types/{id}/activate - Activate flower type

Uses APIClient with JWT auth and response validators.
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
    HTTP_422_UNPROCESSABLE_ENTITY,
)


class TestFlowerTypesList:
    """Tests for GET /api/v1/flower-types"""

    @pytest.mark.positive
    def test_list_flower_types_returns_200(self, admin_client: APIClient):
        """Test GET /flower-types returns 200 with paginated list"""
        response = admin_client.get("/flower-types")

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        assert "pagination" in data
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_flower_types_with_pagination(self, admin_client: APIClient):
        """Test GET /flower-types with pagination parameters"""
        response = admin_client.get("/flower-types", params={"page": 1, "per_page": 5})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 5

    @pytest.mark.positive
    def test_list_flower_types_with_search(self, admin_client: APIClient):
        """Test GET /flower-types with search parameter"""
        response = admin_client.get("/flower-types", params={"search": "rose"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_flower_types_with_is_active_filter(self, admin_client: APIClient):
        """Test GET /flower-types with is_active filter"""
        response = admin_client.get("/flower-types", params={"is_active": True})

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        for ft in data["data"]:
            assert ft["is_active"] is True

    @pytest.mark.positive
    def test_list_flower_types_staff_access(self, staff_client: APIClient):
        """Test GET /flower-types returns 200 for staff users"""
        response = staff_client.get("/flower-types")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_list_flower_types_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /flower-types returns 401 without authentication"""
        response = api_client_v2.get("/flower-types")

        assert_status_code(response, UNAUTH_STATUS)


class TestFlowerTypesActive:
    """Tests for GET /api/v1/flower-types/active"""

    @pytest.mark.positive
    def test_list_active_flower_types_returns_200(self, admin_client: APIClient):
        """Test GET /flower-types/active returns 200 with active types"""
        response = admin_client.get("/flower-types/active")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_active_flower_types_all_active(self, admin_client: APIClient):
        """Test GET /flower-types/active returns only active types"""
        response = admin_client.get("/flower-types/active")

        assert_status_code(response, HTTP_200_OK)
        data = response.json()

        for ft in data["data"]:
            assert ft["is_active"] is True


class TestFlowerTypesGet:
    """Tests for GET /api/v1/flower-types/{id}"""

    @pytest.mark.positive
    def test_get_flower_type_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /flower-types/{id} returns 200 with flower type details"""
        list_response = admin_client.get("/flower-types", params={"per_page": 1})

        if list_response.status_code != 200:
            pytest.skip("Could not fetch flower types list")

        flower_types = list_response.json().get("data", [])
        if not flower_types:
            pytest.skip("No flower types available")

        ft_id = flower_types[0]["id"]

        response = admin_client.get(f"/flower-types/{ft_id}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["id"] == ft_id

    @pytest.mark.negative
    def test_get_flower_type_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /flower-types/{id} returns 404 with invalid ID"""
        response = admin_client.get("/flower-types/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_get_flower_type_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /flower-types/{id} returns 401 without auth"""
        response = api_client_v2.get("/flower-types/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, UNAUTH_STATUS)


class TestFlowerTypesCreate:
    """Tests for POST /api/v1/flower-types"""

    @pytest.mark.positive
    def test_create_flower_type_returns_201(self, admin_client: APIClient):
        """Test POST /flower-types returns 201 with valid data"""
        unique_name = f"Test Flower {uuid.uuid4().hex[:6]}"

        response = admin_client.post(
            "/flower-types/",
            params={
                "name": unique_name,
                "name_ta": f"சோதனை {uuid.uuid4().hex[:6]}",
                "unit": "kg",
            }
        )

        assert response.status_code in [HTTP_200_OK, HTTP_201_CREATED], \
            f"Expected 200/201, got {response.status_code}: {response.text}"

        data = validate_success_response(response)
        assert data["data"]["name"] == unique_name

        # Cleanup
        ft_id = data["data"]["id"]
        if ft_id:
            admin_client.delete(f"/flower-types/{ft_id}")

    @pytest.mark.negative
    def test_create_flower_type_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /flower-types returns 422 with missing required fields"""
        response = admin_client.post("/flower-types/", params={})

        assert response.status_code in [HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_flower_type_farmer_forbidden_returns_403(self, farmer_client: APIClient):
        """Test POST /flower-types returns 403 for farmer users"""
        response = farmer_client.post(
            "/flower-types/",
            params={
                "name": f"Test {uuid.uuid4().hex[:6]}",
                "name_ta": "சோதனை",
                "unit": "kg",
            }
        )

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_create_flower_type_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /flower-types returns 401 without authentication"""
        response = api_client_v2.post(
            "/flower-types/",
            params={"name": "Test", "name_ta": "சோதனை", "unit": "kg"}
        )

        assert_status_code(response, UNAUTH_STATUS)


class TestFlowerTypesUpdate:
    """Tests for PUT /api/v1/flower-types/{id}"""

    @pytest.mark.positive
    def test_update_flower_type_returns_200(self, admin_client: APIClient):
        """Test PUT /flower-types/{id} returns 200 with valid data"""
        # Create a flower type first
        unique_name = f"Update Test {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/flower-types/",
            params={"name": unique_name, "name_ta": "சோதனை", "unit": "kg"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create flower type for update test")

        ft_id = create_response.json()["data"]["id"]

        response = admin_client.put(
            f"/flower-types/{ft_id}",
            params={"name": f"Updated {unique_name}"}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "Updated" in data["data"]["name"]

        # Cleanup
        admin_client.delete(f"/flower-types/{ft_id}")

    @pytest.mark.negative
    def test_update_flower_type_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /flower-types/{id} returns 404 with invalid ID"""
        response = admin_client.put(
            "/flower-types/00000000-0000-0000-0000-000000000000",
            params={"name": "Updated"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestFlowerTypesDelete:
    """Tests for DELETE /api/v1/flower-types/{id}"""

    @pytest.mark.positive
    def test_delete_flower_type_returns_200(self, admin_client: APIClient):
        """Test DELETE /flower-types/{id} returns 200 for valid flower type"""
        unique_name = f"Delete Test {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/flower-types/",
            params={"name": unique_name, "name_ta": "சோதனை", "unit": "kg"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create flower type for deletion test")

        ft_id = create_response.json()["data"]["id"]

        response = admin_client.delete(f"/flower-types/{ft_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_flower_type_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /flower-types/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/flower-types/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_flower_type_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /flower-types/{id} returns 403 for staff users"""
        response = staff_client.delete("/flower-types/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestFlowerTypesDeactivate:
    """Tests for PATCH /api/v1/flower-types/{id}/deactivate"""

    @pytest.mark.positive
    def test_deactivate_flower_type_returns_200(self, admin_client: APIClient):
        """Test PATCH /flower-types/{id}/deactivate returns 200"""
        unique_name = f"Deactivate Test {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/flower-types/",
            params={"name": unique_name, "name_ta": "சோதனை", "unit": "kg"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create flower type for deactivate test")

        ft_id = create_response.json()["data"]["id"]

        response = admin_client.patch(f"/flower-types/{ft_id}/deactivate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is False

        # Cleanup
        admin_client.delete(f"/flower-types/{ft_id}")

    @pytest.mark.negative
    def test_deactivate_flower_type_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /flower-types/{id}/deactivate returns 404"""
        response = admin_client.patch("/flower-types/00000000-0000-0000-0000-000000000000/deactivate")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestFlowerTypesActivate:
    """Tests for PATCH /api/v1/flower-types/{id}/activate"""

    @pytest.mark.positive
    def test_activate_flower_type_returns_200(self, admin_client: APIClient):
        """Test PATCH /flower-types/{id}/activate returns 200"""
        unique_name = f"Activate Test {uuid.uuid4().hex[:6]}"
        create_response = admin_client.post(
            "/flower-types/",
            params={"name": unique_name, "name_ta": "சோதனை", "unit": "kg"}
        )

        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create flower type for activate test")

        ft_id = create_response.json()["data"]["id"]

        # Deactivate first
        admin_client.patch(f"/flower-types/{ft_id}/deactivate")

        # Now activate
        response = admin_client.patch(f"/flower-types/{ft_id}/activate")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["is_active"] is True

        # Cleanup
        admin_client.delete(f"/flower-types/{ft_id}")

    @pytest.mark.negative
    def test_activate_flower_type_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PATCH /flower-types/{id}/activate returns 404"""
        response = admin_client.patch("/flower-types/00000000-0000-0000-0000-000000000000/activate")

        assert_status_code(response, HTTP_404_NOT_FOUND)
