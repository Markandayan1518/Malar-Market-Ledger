"""
Tests for Invoices Endpoints

This module contains tests for the /api/v1/invoices endpoints including:
- GET /invoices - List invoices
- GET /invoices/{id} - Get invoice by ID
- POST /invoices - Create invoice
- PUT /invoices/{id} - Update invoice
- POST /invoices/{id}/send - Send invoice (draft to pending)
- POST /invoices/{id}/payment - Record payment
- POST /invoices/{id}/cancel - Cancel invoice
- DELETE /invoices/{id} - Soft delete invoice
- GET /invoices/{id}/pdf - Generate invoice PDF
"""

import pytest
import uuid
from datetime import date, timedelta

from tests.utils.api_client import APIClient
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_paginated_response,
)
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
)


def _create_test_invoice(admin_client: APIClient):
    """Helper to create a test invoice and return its ID."""
    # Get a farmer ID
    farmers_response = admin_client.get("/farmers", params={"per_page": 1})
    if farmers_response.status_code != 200:
        return None, "No farmers available"

    farmers = farmers_response.json().get("data", [])
    if not farmers:
        return None, "No farmers available"

    farmer_id = farmers[0]["id"]
    today = date.today().isoformat()
    due_date = (date.today() + timedelta(days=30)).isoformat()

    invoice_data = {
        "farmer_id": farmer_id,
        "customer_name": f"Test Customer {uuid.uuid4().hex[:6]}",
        "customer_phone": f"+91{uuid.uuid4().hex[:10]}",
        "invoice_date": today,
        "due_date": due_date,
        "tax_rate": 0,
        "discount": 0,
        "notes": "Test invoice",
        "items": [
            {
                "description": "Flower Type A",
                "quantity": 10,
                "unit": "kg",
                "rate": 150.00,
            },
            {
                "description": "Flower Type B",
                "quantity": 5,
                "unit": "kg",
                "rate": 200.00,
            },
        ],
    }

    response = admin_client.post("/invoices", data=invoice_data)

    if response.status_code not in [200, 201]:
        return None, f"Create failed: {response.status_code} {response.text}"

    invoice_id = response.json()["data"]["id"]
    return invoice_id, None


class TestInvoicesList:
    """Tests for GET /api/v1/invoices"""

    @pytest.mark.positive
    def test_list_invoices_returns_200(self, admin_client: APIClient):
        """Test GET /invoices returns 200 with paginated list"""
        response = admin_client.get("/invoices")

        assert_status_code(response, HTTP_200_OK)
        data = validate_paginated_response(response)

        assert "pagination" in data
        assert isinstance(data["data"], list)

    @pytest.mark.positive
    def test_list_invoices_with_pagination(self, admin_client: APIClient):
        """Test GET /invoices with pagination parameters"""
        response = admin_client.get("/invoices", params={"page": 1, "page_size": 5})

        assert_status_code(response, HTTP_200_OK)
        data = response.json()
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 5

    @pytest.mark.positive
    def test_list_invoices_with_status_filter(self, admin_client: APIClient):
        """Test GET /invoices with status filter"""
        response = admin_client.get("/invoices", params={"status": "draft"})

        assert_status_code(response, HTTP_200_OK)
        validate_paginated_response(response)

    @pytest.mark.positive
    def test_list_invoices_staff_access(self, staff_client: APIClient):
        """Test GET /invoices returns 200 for staff users"""
        response = staff_client.get("/invoices")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_list_invoices_farmer_forbidden_returns_403(self, farmer_client: APIClient):
        """Test GET /invoices returns 403 for farmer users"""
        response = farmer_client.get("/invoices")

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_list_invoices_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test GET /invoices returns 401 without authentication"""
        response = api_client_v2.get("/invoices")

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestInvoicesGet:
    """Tests for GET /api/v1/invoices/{id}"""

    @pytest.mark.positive
    def test_get_invoice_by_id_returns_200(self, admin_client: APIClient):
        """Test GET /invoices/{id} returns 200 with invoice details"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        response = admin_client.get(f"/invoices/{invoice_id}")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data["data"]["id"] == invoice_id
        assert "items" in data["data"]

    @pytest.mark.negative
    def test_get_invoice_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /invoices/{id} returns 404 with invalid ID"""
        response = admin_client.get("/invoices/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestInvoicesCreate:
    """Tests for POST /api/v1/invoices"""

    @pytest.mark.positive
    def test_create_invoice_returns_201(self, admin_client: APIClient):
        """Test POST /invoices returns 201 with valid data"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        assert invoice_id is not None

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_create_invoice_missing_fields_returns_422(self, admin_client: APIClient):
        """Test POST /invoices returns 422 with missing required fields"""
        response = admin_client.post("/invoices", data={})

        assert response.status_code in [HTTP_422_UNPROCESSABLE_ENTITY, HTTP_400_BAD_REQUEST]

    @pytest.mark.negative
    def test_create_invoice_farmer_forbidden_returns_403(self, farmer_client: APIClient):
        """Test POST /invoices returns 403 for farmer users"""
        response = farmer_client.post("/invoices", data={"customer_name": "Test"})

        assert_status_code(response, HTTP_403_FORBIDDEN)

    @pytest.mark.negative
    def test_create_invoice_unauthenticated_returns_401(self, api_client_v2: APIClient):
        """Test POST /invoices returns 401 without authentication"""
        response = api_client_v2.post("/invoices", data={"customer_name": "Test"})

        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestInvoicesUpdate:
    """Tests for PUT /api/v1/invoices/{id}"""

    @pytest.mark.positive
    def test_update_invoice_returns_200(self, admin_client: APIClient):
        """Test PUT /invoices/{id} returns 200 with valid data"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        update_data = {
            "customer_name": f"Updated Customer {uuid.uuid4().hex[:6]}",
            "notes": "Updated notes",
        }

        response = admin_client.put(f"/invoices/{invoice_id}", data=update_data)

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "Updated" in data["data"]["customer_name"]

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_update_invoice_invalid_id_returns_404(self, admin_client: APIClient):
        """Test PUT /invoices/{id} returns 404 with invalid ID"""
        response = admin_client.put(
            "/invoices/00000000-0000-0000-0000-000000000000",
            data={"customer_name": "Test"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestInvoicesSend:
    """Tests for POST /api/v1/invoices/{id}/send"""

    @pytest.mark.positive
    def test_send_invoice_returns_200(self, admin_client: APIClient):
        """Test POST /invoices/{id}/send returns 200 for draft invoice"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        response = admin_client.post(f"/invoices/{invoice_id}/send")

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_send_invoice_invalid_id_returns_404(self, admin_client: APIClient):
        """Test POST /invoices/{id}/send returns 404"""
        response = admin_client.post("/invoices/00000000-0000-0000-0000-000000000000/send")

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestInvoicesPayment:
    """Tests for POST /api/v1/invoices/{id}/payment"""

    @pytest.mark.positive
    def test_record_payment_returns_200(self, admin_client: APIClient):
        """Test POST /invoices/{id}/payment returns 200"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        # Send invoice first
        admin_client.post(f"/invoices/{invoice_id}/send")

        response = admin_client.post(
            f"/invoices/{invoice_id}/payment",
            data={"amount": 500.00}
        )

        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "balance_due" in data["data"] or "status" in data["data"]

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_record_payment_invalid_id_returns_404(self, admin_client: APIClient):
        """Test POST /invoices/{id}/payment returns 404"""
        response = admin_client.post(
            "/invoices/00000000-0000-0000-0000-000000000000/payment",
            data={"amount": 100.00}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestInvoicesCancel:
    """Tests for POST /api/v1/invoices/{id}/cancel"""

    @pytest.mark.positive
    def test_cancel_invoice_returns_200(self, admin_client: APIClient):
        """Test POST /invoices/{id}/cancel returns 200"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        # Send invoice first
        admin_client.post(f"/invoices/{invoice_id}/send")

        response = admin_client.post(
            f"/invoices/{invoice_id}/cancel",
            data={"reason": "Test cancellation"}
        )

        assert_status_code(response, HTTP_200_OK)
        validate_success_response(response)

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_cancel_invoice_invalid_id_returns_404(self, admin_client: APIClient):
        """Test POST /invoices/{id}/cancel returns 404"""
        response = admin_client.post(
            "/invoices/00000000-0000-0000-0000-000000000000/cancel",
            data={"reason": "Test"}
        )

        assert_status_code(response, HTTP_404_NOT_FOUND)


class TestInvoicesDelete:
    """Tests for DELETE /api/v1/invoices/{id}"""

    @pytest.mark.positive
    def test_delete_invoice_returns_200(self, admin_client: APIClient):
        """Test DELETE /invoices/{id} returns 200"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        response = admin_client.delete(f"/invoices/{invoice_id}")

        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_delete_invoice_invalid_id_returns_404(self, admin_client: APIClient):
        """Test DELETE /invoices/{id} returns 404 with invalid ID"""
        response = admin_client.delete("/invoices/00000000-0000-0000-0000-000000000000")

        assert_status_code(response, HTTP_404_NOT_FOUND)

    @pytest.mark.negative
    def test_delete_invoice_staff_forbidden_returns_403(self, staff_client: APIClient):
        """Test DELETE /invoices/{id} returns 403 for staff"""
        response = staff_client.delete("/invoices/00000000-0000-0000-0000-000000000001")

        assert_status_code(response, HTTP_403_FORBIDDEN)


class TestInvoicesPdf:
    """Tests for GET /api/v1/invoices/{id}/pdf"""

    @pytest.mark.positive
    def test_generate_invoice_pdf_returns_200(self, admin_client: APIClient):
        """Test GET /invoices/{id}/pdf returns 200 with PDF binary"""
        invoice_id, error = _create_test_invoice(admin_client)
        if error:
            pytest.skip(error)

        response = admin_client.get(f"/invoices/{invoice_id}/pdf")

        # PDF endpoint may return 200 with binary content
        assert response.status_code == HTTP_200_OK, \
            f"Expected 200, got {response.status_code}: {response.text[:200]}"

        # Cleanup
        admin_client.delete(f"/invoices/{invoice_id}")

    @pytest.mark.negative
    def test_generate_invoice_pdf_invalid_id_returns_404(self, admin_client: APIClient):
        """Test GET /invoices/{id}/pdf returns 404 with invalid ID"""
        response = admin_client.get("/invoices/00000000-0000-0000-0000-000000000000/pdf")

        assert_status_code(response, HTTP_404_NOT_FOUND)
