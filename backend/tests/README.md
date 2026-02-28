# Malar Market Digital Ledger - API Test Suite

This directory contains the Python-based API test suite using pytest and the requests library with Pydantic schema validation.

## Directory Structure

```
backend/tests/
├── __init__.py
├── conftest.py              # Pytest configuration and shared fixtures
├── README.md                # This file
├── schemas/                 # Pydantic models for API contract testing
│   ├── __init__.py
│   ├── common.py            # Common response envelopes and constants
│   ├── auth.py              # Authentication schemas
│   ├── users.py             # User schemas
│   ├── farmers.py           # Farmer schemas
│   ├── flower_types.py      # Flower type schemas
│   ├── time_slots.py        # Time slot schemas
│   ├── market_rates.py      # Market rate schemas
│   ├── daily_entries.py     # Daily entry schemas
│   ├── cash_advances.py     # Cash advance schemas
│   ├── settlements.py       # Settlement schemas
│   ├── reports.py           # Report schemas
│   └── notifications.py     # Notification schemas
├── utils/                   # Test utilities
│   ├── __init__.py
│   ├── api_client.py        # APIClient class for HTTP operations
│   └── response_validators.py # Response validation helpers
├── fixtures/                # Reusable pytest fixtures
│   ├── __init__.py
│   ├── auth_fixtures.py     # Authentication fixtures
│   └── test_data_fixtures.py # Test data fixtures
├── test_api/                # API endpoint tests
│   ├── test_auth.py                 # Original auth tests
│   ├── test_auth_refactored.py      # Refactored auth tests (new pattern)
│   ├── test_farmers.py              # Original farmer tests
│   ├── test_farmers_refactored.py   # Refactored farmer tests (new pattern)
│   ├── test_daily_entries.py        # Original daily entry tests
│   ├── test_daily_entries_refactored.py # Refactored daily entry tests
│   ├── test_market_rates.py         # Original market rate tests
│   ├── test_market_rates_refactored.py  # Refactored market rate tests
│   ├── test_cash_advances.py        # Original cash advance tests
│   ├── test_cash_advances_refactored.py # Refactored cash advance tests
│   ├── test_settlements.py          # Original settlement tests
│   ├── test_settlements_refactored.py   # Refactored settlement tests
│   └── test_reports.py              # Report tests
└── test_models/             # Model tests
    └── test_models.py
```

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL (test database)
- Backend API running

### Environment Variables

```bash
# API Configuration
API_BASE_URL=http://localhost:8000/api/v1

# Test Database
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/malar_market_ledger_test

# Test User Credentials
TEST_ADMIN_EMAIL=admin@malarmarket.com
TEST_ADMIN_PASSWORD=admin123
TEST_STAFF_EMAIL=staff@malarmarket.com
TEST_STAFF_PASSWORD=staff123
TEST_FARMER_EMAIL=farmer1@malarmarket.com
TEST_FARMER_PASSWORD=farmer123
```

### Running Tests

```bash
# From backend/ directory

# Activate virtual environment
source venv/bin/activate

# Run all tests
pytest

# Run specific test file
pytest tests/test_api/test_auth_refactored.py

# Run specific test class
pytest tests/test_api/test_auth_refactored.py::TestAuthLogin

# Run specific test
pytest tests/test_api/test_auth_refactored.py::TestAuthLogin::test_login_with_valid_admin_credentials_returns_200

# Run with markers
pytest -m positive  # Run only positive tests
pytest -m negative  # Run only negative tests
pytest -m auth      # Run only auth-related tests

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html
```

## Test Patterns

### Using the APIClient

The new `APIClient` class provides a clean interface for making API requests with automatic JWT token management:

```python
from tests.utils.api_client import APIClient

# Create client
client = APIClient(base_url="http://localhost:8000/api/v1")

# Login (automatically sets tokens)
client.login("admin@malarmarket.com", "password")

# Make authenticated requests
response = client.get("/farmers")
response = client.post("/farmers", data={"name": "New Farmer"})
response = client.put("/farmers/{id}", data={"name": "Updated"})
response = client.delete("/farmers/{id}")

# Refresh tokens
client.refresh_access_token()

# Logout
client.logout()
```

### Using Pydantic Schemas for Requests

Create request payloads using Pydantic models:

```python
from tests.schemas.farmers import FarmerCreate
from tests.schemas.daily_entries import DailyEntryCreate

# Farmer creation
farmer_data = FarmerCreate(
    farmer_code="FAR001",
    name="Raj Kumar",
    village="Madurai",
    phone="+919876543211",
    commission_pct=10.00
)

response = client.post("/farmers", data=farmer_data)
```

### Validating Responses

Use the response validators to validate response structure:

```python
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_error_response,
    validate_paginated_response,
)
from tests.schemas.common import HTTP_200_OK, HTTP_401_UNAUTHORIZED

# Validate status code
assert_status_code(response, HTTP_200_OK)

# Validate success response structure
data = validate_success_response(response)

# Validate error response structure
error = validate_error_response(response, expected_code="VALIDATION_ERROR")

# Validate paginated response
data = validate_paginated_response(response)
```

### Validating Response Data with Pydantic

Validate response data against Pydantic schemas:

```python
from tests.schemas.farmers import FarmerResponse

# Validate response data
data = validate_success_response(response)
farmer = FarmerResponse.model_validate(data["data"])

# Access validated fields
assert farmer.name == "Raj Kumar"
assert farmer.farmer_code == "FAR001"
```

### Using Fixtures

The conftest.py provides several fixtures:

```python
# Unauthenticated client
def test_something(api_client_v2: APIClient):
    response = api_client_v2.get("/public-endpoint")

# Admin authenticated client
def test_admin_operation(admin_client: APIClient):
    response = admin_client.get("/admin-only-endpoint")

# Staff authenticated client
def test_staff_operation(staff_client: APIClient):
    response = staff_client.get("/staff-endpoint")

# Test credentials
def test_with_credentials(admin_credentials: Dict[str, str]):
    email = admin_credentials["email"]
```

## Test Organization

### Test Classes

Organize tests by endpoint groups:

```python
class TestFarmersList:
    """Tests for GET /api/v1/farmers"""
    
    @pytest.mark.positive
    def test_list_farmers_returns_200(self, admin_client: APIClient):
        ...
    
    @pytest.mark.negative
    def test_list_farmers_unauthenticated_returns_401(self, api_client_v2: APIClient):
        ...

class TestFarmersCreate:
    """Tests for POST /api/v1/farmers"""
    ...
```

### Test Markers

Use markers to categorize tests:

- `@pytest.mark.positive` - Positive test cases
- `@pytest.mark.negative` - Negative test cases
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.auth` - Authentication-related tests

## Response Envelopes

All API responses follow standard envelopes defined in `schemas/common.py`:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...]
  }
}
```

## HTTP Status Codes

Common status codes are defined in `schemas/common.py`:

| Constant | Code | Description |
|----------|------|-------------|
| HTTP_200_OK | 200 | Success |
| HTTP_201_CREATED | 201 | Resource created |
| HTTP_400_BAD_REQUEST | 400 | Invalid request |
| HTTP_401_UNAUTHORIZED | 401 | Authentication required |
| HTTP_403_FORBIDDEN | 403 | Permission denied |
| HTTP_404_NOT_FOUND | 404 | Resource not found |
| HTTP_409_CONFLICT | 409 | Resource conflict |
| HTTP_422_UNPROCESSABLE_ENTITY | 422 | Validation error |

## Error Codes

Standard error codes are defined in `schemas/common.py`:

- `ERROR_VALIDATION` - Request validation failed
- `ERROR_AUTHENTICATION_FAILED` - Invalid credentials
- `ERROR_TOKEN_EXPIRED` - Access token expired
- `ERROR_PERMISSION_DENIED` - Insufficient permissions
- `ERROR_RESOURCE_NOT_FOUND` - Resource not found
- `ERROR_RESOURCE_ALREADY_EXISTS` - Duplicate resource

## Best Practices

1. **Use Pydantic models for all request data** - Ensures type safety and validation
2. **Validate response schemas** - Use Pydantic to validate response structure
3. **Use descriptive test names** - Test names should describe the scenario and expected outcome
4. **One assertion per test when possible** - Tests should focus on a single behavior
5. **Clean up created resources** - Delete test data after creation tests
6. **Use appropriate test markers** - Categorize tests for selective running
7. **Handle skip conditions gracefully** - Use `pytest.skip()` when prerequisites aren't met

## Migration from Playwright

This test suite replaces the previous Playwright-based API tests. Key differences:

| Aspect | Old (Playwright) | New (pytest + requests) |
|--------|------------------|------------------------|
| Framework | Playwright | pytest |
| HTTP Client | Playwright request context | requests library |
| Schema Validation | Manual assertions | Pydantic models |
| Authentication | Manual token handling | APIClient auto-management |
| Type Safety | None | Full Pydantic validation |

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure you're running from the `backend/` directory with the virtual environment activated
2. **Authentication failures**: Check that test user credentials are correct in environment variables
3. **Database errors**: Ensure the test database exists and is accessible
4. **Connection refused**: Verify the backend API is running on the expected port

### Debug Mode

Run tests with verbose output and print statements:

```bash
pytest -v -s tests/test_api/test_auth_refactored.py
```
