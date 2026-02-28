# API Test Suite Refactoring Specification

## Overview

This specification outlines the complete refactoring of the existing API test suite by removing all Playwright dependencies and migrating to a pure Python-based testing framework using pytest and the requests library. The refactoring emphasizes strict Pydantic integration for type-safe request/response validation.

## Current State Analysis

### Existing Backend Test Infrastructure
- Location: `backend/tests/`
- Framework: pytest + requests library (HTTP-based tests)
- Fixtures: `backend/tests/conftest.py` provides authentication fixtures
- Test Files:
  - `test_api/test_auth.py` - Authentication endpoints
  - `test_api/test_farmers.py` - Farmer management
  - `test_api/test_daily_entries.py` - Daily entry operations
  - `test_api/test_market_rates.py` - Market rate management
  - `test_api/test_cash_advances.py` - Cash advance operations
  - `test_api/test_settlements.py` - Settlement processing
  - `test_api/test_reports.py` - Report generation

### Existing Pydantic Schemas
- Location: `backend/app/schemas/`
- Files:
  - `all_schemas.py` - Complete schema definitions
  - `common.py` - Standard response envelopes (SuccessResponse, ErrorResponse, PaginatedResponse)

### Frontend API Tests (To Be Removed)
- Location: `frontend/tests/api/`
- Files:
  - `api/apiClient.js` - Playwright-based API client
  - `api/auth.spec.js` - Auth tests
  - `api/dailyEntries.spec.js` - Daily entry tests
  - `api/farmers.spec.js` - Farmer tests

---

## Target Architecture

### New Test Directory Structure

```
backend/tests/
├── conftest.py                    # Global pytest fixtures and configuration
├── __init__.py
│
├── schemas/                       # Pydantic models for API contract testing
│   ├── __init__.py
│   ├── common.py                  # Standard response envelopes
│   ├── auth.py                    # Auth request/response models
│   ├── users.py                   # User models
│   ├── farmers.py                 # Farmer models
│   ├── flower_types.py            # Flower type models
│   ├── time_slots.py              # Time slot models
│   ├── market_rates.py            # Market rate models
│   ├── daily_entries.py           # Daily entry models
│   ├── cash_advances.py           # Cash advance models
│   ├── settlements.py             # Settlement models
│   ├── notifications.py           # Notification models
│   └── reports.py                 # Report models
│
├── fixtures/                      # Test data fixtures
│   ├── __init__.py
│   ├── auth_fixtures.py           # Authentication test data
│   ├── farmer_fixtures.py         # Farmer test data
│   ├── flower_type_fixtures.py    # Flower type test data
│   ├── market_rate_fixtures.py    # Market rate test data
│   └── entry_fixtures.py          # Daily entry test data
│
├── utils/                         # Test utilities
│   ├── __init__.py
│   ├── api_client.py              # Typed API client wrapper
│   ├── response_validators.py     # Response validation helpers
│   └── assertions.py              # Custom assertion helpers
│
└── test_api/                      # API endpoint tests
    ├── __init__.py
    ├── test_auth.py               # Authentication tests
    ├── test_users.py              # User management tests
    ├── test_farmers.py            # Farmer CRUD tests
    ├── test_flower_types.py       # Flower type tests
    ├── test_time_slots.py         # Time slot tests
    ├── test_market_rates.py       # Market rate tests
    ├── test_daily_entries.py      # Daily entry tests
    ├── test_cash_advances.py      # Cash advance tests
    ├── test_settlements.py        # Settlement tests
    ├── test_notifications.py      # Notification tests
    ├── test_reports.py            # Report tests
    └── test_data_import.py        # Data import tests
```

---

## Pydantic Models for API Contract Testing

### Standard Response Envelopes

Based on `docs/api-design.md`, all responses follow these formats:

```python
# backend/tests/schemas/common.py

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime

T = TypeVar('T')

class PaginationMeta(BaseModel):
    """Pagination metadata from API responses."""
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool

class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None

class ErrorDetail(BaseModel):
    """Individual error detail."""
    field: str
    message: str

class ErrorBody(BaseModel):
    """Error body structure."""
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None

class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    success: bool = False
    error: ErrorBody
    message: str

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response wrapper."""
    success: bool = True
    data: List[Any]
    pagination: PaginationMeta
    message: Optional[str] = None
```

### Authentication Models

```python
# backend/tests/schemas/auth.py

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = 'admin'
    STAFF = 'staff'
    FARMER = 'farmer'

# Request Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

# Response Models
class UserInToken(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    language_preference: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int
    user: UserInToken

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int

class LogoutResponse(BaseModel):
    success: bool = True
    message: str
```

### Farmer Models

```python
# backend/tests/schemas/farmers.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class FarmerBase(BaseModel):
    id: str
    farmer_code: str
    name: str
    village: Optional[str] = None
    phone: str
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    current_balance: Decimal
    total_advances: Decimal
    total_settlements: Decimal
    commission_pct: Decimal
    flat_fee_monthly: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

class FarmerCreate(BaseModel):
    farmer_code: str = Field(min_length=3, max_length=20)
    name: str = Field(min_length=2)
    village: Optional[str] = None
    phone: str = Field(min_length=10, max_length=20)
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    commission_pct: Decimal = Field(default=Decimal('10.00'), ge=0, le=100)
    flat_fee_monthly: Decimal = Field(default=Decimal('0.00'), ge=0)

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    commission_pct: Optional[Decimal] = Field(None, ge=0, le=100)
    flat_fee_monthly: Optional[Decimal] = Field(None, ge=0)

class FarmerBalance(BaseModel):
    farmer_id: str
    current_balance: Decimal
    total_advances: Decimal
    total_settlements: Decimal
    last_updated: datetime
```

### Daily Entry Models

```python
# backend/tests/schemas/daily_entries.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time, datetime
from decimal import Decimal
from enum import Enum

class AdjustmentReasonCode(str, Enum):
    LATE = 'LATE'
    WET = 'WET'
    QUALITY = 'QUALITY'
    BONUS = 'BONUS'
    OTHER = 'OTHER'

class DailyEntryCreate(BaseModel):
    farmer_id: str
    flower_type_id: str
    entry_date: date
    entry_time: time
    quantity: Decimal = Field(gt=0)
    manual_adj_amount: Optional[Decimal] = Field(default=Decimal('0.00'))
    adj_reason_code: Optional[str] = None
    notes: Optional[str] = None

class DailyEntryUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    entry_time: Optional[time] = None
    manual_adj_amount: Optional[Decimal] = None
    adj_reason_code: Optional[str] = None
    notes: Optional[str] = None

class NestedFarmer(BaseModel):
    farmer_code: str
    name: str
    phone: Optional[str] = None

class NestedFlowerType(BaseModel):
    name: str
    name_ta: Optional[str] = None
    code: str
    unit: str

class NestedTimeSlot(BaseModel):
    name: str
    name_ta: Optional[str] = None
    start_time: time
    end_time: time

class DailyEntryResponse(BaseModel):
    id: str
    farmer_id: str
    farmer: NestedFarmer
    flower_type_id: str
    flower_type: NestedFlowerType
    time_slot_id: str
    time_slot: NestedTimeSlot
    entry_date: date
    entry_time: time
    quantity: Decimal
    rate_per_unit: Decimal
    total_amount: Decimal
    commission_rate: Decimal
    commission_amount: Decimal
    manual_adj_amount: Optional[Decimal] = None
    adj_reason_code: Optional[str] = None
    net_amount: Decimal
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
```

---

## Global Pytest Fixtures

### Authentication Fixtures

```python
# backend/tests/conftest.py (enhanced)

import pytest
import requests
import os
from typing import Dict, Optional, Generator
from requests.Session import Session

# Configuration
BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000/api/v1')
TEST_ADMIN_EMAIL = os.getenv('TEST_ADMIN_EMAIL', 'admin@malarmarket.com')
TEST_ADMIN_PASSWORD = os.getenv('TEST_ADMIN_PASSWORD', 'admin123')
TEST_STAFF_EMAIL = os.getenv('TEST_STAFF_EMAIL', 'staff@malarmarket.com')
TEST_STAFF_PASSWORD = os.getenv('TEST_STAFF_PASSWORD', 'staff123')
TEST_FARMER_EMAIL = os.getenv('TEST_FARMER_EMAIL', 'farmer1@malarmarket.com')
TEST_FARMER_PASSWORD = os.getenv('TEST_FARMER_PASSWORD', 'farmer123')

# ==================== Session Fixtures ====================

@pytest.fixture(scope='session')
def base_url() -> str:
    """Return the API base URL."""
    return BASE_URL

@pytest.fixture(scope='session')
def api_client() -> Generator[Session, None, None]:
    """Provide a requests session for API calls."""
    session = Session()
    session.headers.update({'Content-Type': 'application/json'})
    yield session
    session.close()

# ==================== Authentication Fixtures ====================

@pytest.fixture(scope='session')
def admin_credentials() -> Dict[str, str]:
    """Return admin user credentials."""
    return {'email': TEST_ADMIN_EMAIL, 'password': TEST_ADMIN_PASSWORD}

@pytest.fixture(scope='session')
def staff_credentials() -> Dict[str, str]:
    """Return staff user credentials."""
    return {'email': TEST_STAFF_EMAIL, 'password': TEST_STAFF_PASSWORD}

@pytest.fixture(scope='session')
def farmer_credentials() -> Dict[str, str]:
    """Return farmer user credentials."""
    return {'email': TEST_FARMER_EMAIL, 'password': TEST_FARMER_PASSWORD}

@pytest.fixture(scope='session')
def admin_login_response(api_client: Session, base_url: str, admin_credentials: Dict) -> Optional[Dict]:
    """Perform admin login and return full response."""
    response = api_client.post(
        f'{base_url}/auth/login',
        json=admin_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json()
    return None

@pytest.fixture(scope='session')
def admin_token(admin_login_response: Optional[Dict]) -> Optional[str]:
    """Return admin JWT access token."""
    if admin_login_response:
        return admin_login_response.get('access_token')
    return None

@pytest.fixture(scope='session')
def admin_refresh_token(admin_login_response: Optional[Dict]) -> Optional[str]:
    """Return admin JWT refresh token."""
    if admin_login_response:
        return admin_login_response.get('refresh_token')
    return None

@pytest.fixture(scope='session')
def staff_login_response(api_client: Session, base_url: str, staff_credentials: Dict) -> Optional[Dict]:
    """Perform staff login and return full response."""
    response = api_client.post(
        f'{base_url}/auth/login',
        json=staff_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json()
    return None

@pytest.fixture(scope='session')
def staff_token(staff_login_response: Optional[Dict]) -> Optional[str]:
    """Return staff JWT access token."""
    if staff_login_response:
        return staff_login_response.get('access_token')
    return None

@pytest.fixture(scope='session')
def farmer_login_response(api_client: Session, base_url: str, farmer_credentials: Dict) -> Optional[Dict]:
    """Perform farmer login and return full response."""
    response = api_client.post(
        f'{base_url}/auth/login',
        json=farmer_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json()
    return None

@pytest.fixture(scope='session')
def farmer_token(farmer_login_response: Optional[Dict]) -> Optional[str]:
    """Return farmer JWT access token."""
    if farmer_login_response:
        return farmer_login_response.get('access_token')
    return None

# ==================== Auth Header Fixtures ====================

@pytest.fixture
def admin_auth_header(admin_token: Optional[str]) -> Dict[str, str]:
    """Return authorization header with admin token."""
    if admin_token:
        return {'Authorization': f'Bearer {admin_token}'}
    return {}

@pytest.fixture
def staff_auth_header(staff_token: Optional[str]) -> Dict[str, str]:
    """Return authorization header with staff token."""
    if staff_token:
        return {'Authorization': f'Bearer {staff_token}'}
    return {}

@pytest.fixture
def farmer_auth_header(farmer_token: Optional[str]) -> Dict[str, str]:
    """Return authorization header with farmer token."""
    if farmer_token:
        return {'Authorization': f'Bearer {farmer_token}'}
    return {}

# ==================== Helper Functions ====================

def get_auth_header(token: str) -> Dict[str, str]:
    """Create authorization header from token."""
    return {'Authorization': f'Bearer {token}'}

def make_authenticated_request(
    api_client: Session,
    method: str,
    url: str,
    token: str,
    json: Optional[Dict] = None,
    params: Optional[Dict] = None,
    timeout: int = 30
) -> requests.Response:
    """Make an authenticated HTTP request."""
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    
    method = method.upper()
    if method == 'GET':
        return api_client.get(url, headers=headers, params=params, timeout=timeout)
    elif method == 'POST':
        return api_client.post(url, headers=headers, json=json, timeout=timeout)
    elif method == 'PUT':
        return api_client.put(url, headers=headers, json=json, timeout=timeout)
    elif method == 'PATCH':
        return api_client.patch(url, headers=headers, json=json, timeout=timeout)
    elif method == 'DELETE':
        return api_client.delete(url, headers=headers, timeout=timeout)
    else:
        raise ValueError(f'Unsupported HTTP method: {method}')
```

---

## API Client Wrapper

```python
# backend/tests/utils/api_client.py

from typing import Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
import requests
from requests.Session import Session

from tests.schemas.common import SuccessResponse, ErrorResponse, PaginatedResponse

T = TypeVar('T', bound=BaseModel)

class APIClient:
    """Typed API client for making requests with Pydantic validation."""
    
    def __init__(self, base_url: str, session: Optional[Session] = None):
        self.base_url = base_url.rstrip('/')
        self.session = session or requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def _build_url(self, endpoint: str) -> str:
        """Build full URL from endpoint."""
        return f'{self.base_url}{endpoint}'
    
    def request(
        self,
        method: str,
        endpoint: str,
        token: Optional[str] = None,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        timeout: int = 30
    ) -> requests.Response:
        """Make HTTP request with optional authentication."""
        url = self._build_url(endpoint)
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        return self.session.request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            params=params,
            timeout=timeout
        )
    
    def get(self, endpoint: str, token: Optional[str] = None, **kwargs) -> requests.Response:
        """Make GET request."""
        return self.request('GET', endpoint, token=token, **kwargs)
    
    def post(self, endpoint: str, token: Optional[str] = None, **kwargs) -> requests.Response:
        """Make POST request."""
        return self.request('POST', endpoint, token=token, **kwargs)
    
    def put(self, endpoint: str, token: Optional[str] = None, **kwargs) -> requests.Response:
        """Make PUT request."""
        return self.request('PUT', endpoint, token=token, **kwargs)
    
    def delete(self, endpoint: str, token: Optional[str] = None, **kwargs) -> requests.Response:
        """Make DELETE request."""
        return self.request('DELETE', endpoint, token=token, **kwargs)
    
    def validate_response(
        self,
        response: requests.Response,
        model: Type[T],
        expected_status: int = 200
    ) -> T:
        """Validate response against Pydantic model."""
        assert response.status_code == expected_status, \
            f'Expected status {expected_status}, got {response.status_code}: {response.text}'
        
        data = response.json()
        return model.model_validate(data)
    
    def validate_success_response(
        self,
        response: requests.Response,
        data_model: Type[T],
        expected_status: int = 200
    ) -> SuccessResponse[T]:
        """Validate success response envelope."""
        assert response.status_code == expected_status
        
        data = response.json()
        assert data.get('success') is True
        
        # Validate nested data
        if data.get('data'):
            validated_data = data_model.model_validate(data['data'])
            return SuccessResponse[data_model](
                success=True,
                data=validated_data,
                message=data.get('message')
            )
        
        return SuccessResponse[data_model](**data)
    
    def validate_paginated_response(
        self,
        response: requests.Response,
        item_model: Type[T],
        expected_status: int = 200
    ) -> PaginatedResponse[T]:
        """Validate paginated response envelope."""
        assert response.status_code == expected_status
        
        data = response.json()
        assert data.get('success') is True
        assert 'pagination' in data
        
        # Validate each item in data array
        validated_items = [item_model.model_validate(item) for item in data['data']]
        
        return PaginatedResponse[item_model](
            success=True,
            data=validated_items,
            pagination=data['pagination'],
            message=data.get('message')
        )
    
    def validate_error_response(
        self,
        response: requests.Response,
        expected_status: int = 400,
        expected_error_code: Optional[str] = None
    ) -> ErrorResponse:
        """Validate error response envelope."""
        assert response.status_code == expected_status
        
        data = response.json()
        assert data.get('success') is False
        assert 'error' in data
        
        if expected_error_code:
            assert data['error'].get('code') == expected_error_code
        
        return ErrorResponse.model_validate(data)
```

---

## Response Validators

```python
# backend/tests/utils/response_validators.py

from typing import Type, TypeVar, Optional, List
from pydantic import BaseModel, ValidationError
import requests

from tests.schemas.common import (
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta
)

T = TypeVar('T', bound=BaseModel)

def validate_status_code(response: requests.Response, expected: int) -> None:
    """Validate HTTP status code."""
    assert response.status_code == expected, \
        f'Expected status {expected}, got {response.status_code}: {response.text}'

def validate_json_response(response: requests.Response) -> dict:
    """Validate response is valid JSON."""
    try:
        return response.json()
    except ValueError as e:
        raise AssertionError(f'Response is not valid JSON: {response.text}') from e

def validate_success_response(
    response: requests.Response,
    data_model: Optional[Type[T]] = None,
    expected_status: int = 200
) -> dict:
    """Validate standard success response structure."""
    validate_status_code(response, expected_status)
    data = validate_json_response(response)
    
    assert data.get('success') is True, 'Response success field must be true'
    
    if data_model and data.get('data'):
        try:
            data_model.model_validate(data['data'])
        except ValidationError as e:
            raise AssertionError(f'Data validation failed: {e}') from e
    
    return data

def validate_error_response(
    response: requests.Response,
    expected_status: int = 400,
    expected_code: Optional[str] = None
) -> dict:
    """Validate standard error response structure."""
    validate_status_code(response, expected_status)
    data = validate_json_response(response)
    
    assert data.get('success') is False, 'Response success field must be false'
    assert 'error' in data, 'Error response must contain error field'
    assert 'code' in data['error'], 'Error must contain code field'
    assert 'message' in data['error'], 'Error must contain message field'
    
    if expected_code:
        assert data['error']['code'] == expected_code, \
            f"Expected error code '{expected_code}', got '{data['error']['code']}'"
    
    return data

def validate_paginated_response(
    response: requests.Response,
    item_model: Optional[Type[T]] = None,
    expected_status: int = 200
) -> dict:
    """Validate paginated response structure."""
    validate_status_code(response, expected_status)
    data = validate_json_response(response)
    
    assert data.get('success') is True, 'Response success field must be true'
    assert 'data' in data, 'Paginated response must contain data array'
    assert 'pagination' in data, 'Paginated response must contain pagination field'
    assert isinstance(data['data'], list), 'Data must be an array'
    
    # Validate pagination metadata
    pagination = data['pagination']
    assert 'page' in pagination
    assert 'page_size' in pagination
    assert 'total_items' in pagination
    assert 'total_pages' in pagination
    assert 'has_next' in pagination
    assert 'has_previous' in pagination
    
    # Validate pagination constraints
    assert pagination['page'] >= 1, 'Page must be >= 1'
    assert pagination['page_size'] >= 1, 'Page size must be >= 1'
    assert pagination['page_size'] <= 100, 'Page size must be <= 100'
    
    # Validate each item against model
    if item_model:
        for i, item in enumerate(data['data']):
            try:
                item_model.model_validate(item)
            except ValidationError as e:
                raise AssertionError(f'Item {i} validation failed: {e}') from e
    
    return data

def validate_pagination_meta(pagination: dict) -> PaginationMeta:
    """Validate and return pagination metadata."""
    return PaginationMeta.model_validate(pagination)

def validate_response_has_fields(response: requests.Response, fields: List[str]) -> None:
    """Validate response contains specific fields."""
    data = validate_json_response(response)
    for field in fields:
        assert field in data, f"Response missing required field: '{field}'"

def validate_response_data_has_fields(
    response: requests.Response,
    fields: List[str],
    expected_status: int = 200
) -> None:
    """Validate response data object contains specific fields."""
    data = validate_success_response(response, expected_status=expected_status)
    response_data = data.get('data', {})
    for field in fields:
        assert field in response_data, f"Response data missing required field: '{field}'"
```

---

## Test Module Structure

### Authentication Tests Example

```python
# backend/tests/test_api/test_auth.py

import pytest
import requests
from pydantic import ValidationError

from tests.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserInToken
)
from tests.schemas.common import SuccessResponse, ErrorResponse
from tests.utils.response_validators import (
    validate_success_response,
    validate_error_response
)

class TestAuthLogin:
    """Tests for POST /api/v1/auth/login"""
    
    @pytest.mark.positive
    def test_login_with_valid_admin_credentials_returns_200(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_credentials: dict
    ):
        """Test successful login with admin credentials."""
        # Create typed request
        login_request = LoginRequest(**admin_credentials)
        
        # Make request
        response = api_client.post(
            f'{base_url}/auth/login',
            json=login_request.model_dump(),
            timeout=30
        )
        
        # Validate response
        data = validate_success_response(response, expected_status=200)
        
        # Validate response structure with Pydantic
        login_response = LoginResponse.model_validate(data['data'])
        
        assert login_response.token_type == 'bearer'
        assert login_response.expires_in > 0
        assert login_response.access_token is not None
        assert login_response.refresh_token is not None
        
        # Validate user data
        assert login_response.user.role == 'admin'
        assert login_response.user.email == admin_credentials['email']
    
    @pytest.mark.positive
    def test_login_with_valid_staff_credentials_returns_200(
        self,
        api_client: requests.Session,
        base_url: str,
        staff_credentials: dict
    ):
        """Test successful login with staff credentials."""
        login_request = LoginRequest(**staff_credentials)
        
        response = api_client.post(
            f'{base_url}/auth/login',
            json=login_request.model_dump(),
            timeout=30
        )
        
        data = validate_success_response(response, expected_status=200)
        login_response = LoginResponse.model_validate(data['data'])
        
        assert login_response.user.role == 'staff'
    
    @pytest.mark.negative
    def test_login_with_invalid_credentials_returns_401(
        self,
        api_client: requests.Session,
        base_url: str
    ):
        """Test login with invalid credentials returns 401."""
        login_request = LoginRequest(
            email='nonexistent@example.com',
            password='wrongpassword'
        )
        
        response = api_client.post(
            f'{base_url}/auth/login',
            json=login_request.model_dump(),
            timeout=30
        )
        
        validate_error_response(
            response,
            expected_status=401,
            expected_code='AUTHENTICATION_FAILED'
        )
    
    @pytest.mark.negative
    def test_login_with_missing_email_returns_422(
        self,
        api_client: requests.Session,
        base_url: str
    ):
        """Test login without email returns validation error."""
        response = api_client.post(
            f'{base_url}/auth/login',
            json={'password': 'somepassword'},
            timeout=30
        )
        
        validate_error_response(response, expected_status=422)


class TestAuthRefresh:
    """Tests for POST /api/v1/auth/refresh"""
    
    @pytest.mark.positive
    def test_refresh_token_returns_200(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_refresh_token: str
    ):
        """Test successful token refresh."""
        if not admin_refresh_token:
            pytest.skip('No refresh token available')
        
        refresh_request = RefreshTokenRequest(refresh_token=admin_refresh_token)
        
        response = api_client.post(
            f'{base_url}/auth/refresh',
            json=refresh_request.model_dump(),
            timeout=30
        )
        
        data = validate_success_response(response, expected_status=200)
        refresh_response = RefreshTokenResponse.model_validate(data['data'])
        
        assert refresh_response.access_token is not None
        assert refresh_response.token_type == 'bearer'
    
    @pytest.mark.negative
    def test_refresh_with_invalid_token_returns_401(
        self,
        api_client: requests.Session,
        base_url: str
    ):
        """Test refresh with invalid token returns 401."""
        refresh_request = RefreshTokenRequest(refresh_token='invalid-token')
        
        response = api_client.post(
            f'{base_url}/auth/refresh',
            json=refresh_request.model_dump(),
            timeout=30
        )
        
        validate_error_response(
            response,
            expected_status=401,
            expected_code='REFRESH_TOKEN_INVALID'
        )


class TestAuthLogout:
    """Tests for POST /api/v1/auth/logout"""
    
    @pytest.mark.positive
    def test_logout_with_valid_token_returns_200(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_token: str
    ):
        """Test successful logout."""
        if not admin_token:
            pytest.skip('No auth token available')
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        response = api_client.post(
            f'{base_url}/auth/logout',
            headers=headers,
            timeout=30
        )
        
        validate_success_response(response, expected_status=200)
    
    @pytest.mark.negative
    def test_logout_without_token_returns_401(
        self,
        api_client: requests.Session,
        base_url: str
    ):
        """Test logout without token returns 401."""
        response = api_client.post(
            f'{base_url}/auth/logout',
            timeout=30
        )
        
        validate_error_response(response, expected_status=401)
```

### Farmers Tests Example

```python
# backend/tests/test_api/test_farmers.py

import pytest
import requests
from decimal import Decimal

from tests.schemas.farmers import (
    FarmerCreate,
    FarmerUpdate,
    FarmerResponse,
    FarmerBalance
)
from tests.utils.response_validators import (
    validate_success_response,
    validate_error_response,
    validate_paginated_response
)

class TestFarmersList:
    """Tests for GET /api/v1/farmers"""
    
    @pytest.mark.positive
    def test_list_farmers_returns_200(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_auth_header: dict
    ):
        """Test listing farmers with pagination."""
        response = api_client.get(
            f'{base_url}/farmers',
            headers=admin_auth_header,
            params={'page': 1, 'page_size': 20},
            timeout=30
        )
        
        data = validate_paginated_response(response, item_model=FarmerResponse)
        
        # Validate pagination
        assert data['pagination']['page'] == 1
        assert data['pagination']['page_size'] == 20
    
    @pytest.mark.negative
    def test_list_farmers_without_auth_returns_401(
        self,
        api_client: requests.Session,
        base_url: str
    ):
        """Test listing farmers without authentication."""
        response = api_client.get(
            f'{base_url}/farmers',
            timeout=30
        )
        
        validate_error_response(response, expected_status=401)


class TestFarmersCreate:
    """Tests for POST /api/v1/farmers"""
    
    @pytest.mark.positive
    def test_create_farmer_returns_201(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_auth_header: dict
    ):
        """Test creating a new farmer."""
        farmer_data = FarmerCreate(
            farmer_code='TEST001',
            name='Test Farmer',
            village='Test Village',
            phone='+919876543210',
            commission_pct=Decimal('10.00')
        )
        
        response = api_client.post(
            f'{base_url}/farmers',
            headers=admin_auth_header,
            json=farmer_data.model_dump(mode='json'),
            timeout=30
        )
        
        data = validate_success_response(response, expected_status=201)
        farmer = FarmerResponse.model_validate(data['data'])
        
        assert farmer.farmer_code == farmer_data.farmer_code
        assert farmer.name == farmer_data.name
    
    @pytest.mark.negative
    def test_create_farmer_with_duplicate_code_returns_409(
        self,
        api_client: requests.Session,
        base_url: str,
        admin_auth_header: dict
    ):
        """Test creating farmer with duplicate code."""
        # This assumes a farmer with code FAR001 already exists
        farmer_data = FarmerCreate(
            farmer_code='FAR001',  # Duplicate code
            name='Duplicate Farmer',
            phone='+919876543299'
        )
        
        response = api_client.post(
            f'{base_url}/farmers',
            headers=admin_auth_header,
            json=farmer_data.model_dump(mode='json'),
            timeout=30
        )
        
        validate_error_response(
            response,
            expected_status=409,
            expected_code='RESOURCE_ALREADY_EXISTS'
        )
```

---

## Migration Strategy

### Phase 1: Setup Infrastructure
1. Create new test directory structure under `backend/tests/`
2. Create Pydantic schema models in `backend/tests/schemas/`
3. Create utility modules in `backend/tests/utils/`
4. Enhance `conftest.py` with new fixtures

### Phase 2: Migrate Backend Tests
1. Refactor existing `test_api/*.py` files to use new Pydantic models
2. Update response validation to use typed validators
3. Ensure all tests use requests library (already in place)

### Phase 3: Remove Playwright API Tests
1. Delete `frontend/tests/api/` directory
2. Update `frontend/package.json` to remove API test scripts
3. Update `frontend/playwright.config.js` to remove API test references
4. Update documentation to reflect Python-only API testing

### Phase 4: Documentation
1. Update `AGENTS.md` with new testing commands
2. Create API testing guide in `docs/testing-guide.md`
3. Update `backend/README.md` with test examples

---

## Test Coverage Requirements

### Endpoints to Test

| Module | Endpoints | Test File |
|--------|-----------|-----------|
| Auth | login, refresh, logout, forgot-password, reset-password | test_auth.py |
| Users | list, get, create, update, delete | test_users.py |
| Farmers | list, get, create, update, delete, balance | test_farmers.py |
| Flower Types | list, get, create, update | test_flower_types.py |
| Time Slots | list, get | test_time_slots.py |
| Market Rates | list, get current, create | test_market_rates.py |
| Daily Entries | list, get, create, update, delete | test_daily_entries.py |
| Cash Advances | list, get, create, approve, reject | test_cash_advances.py |
| Settlements | list, get, generate, approve, mark-paid | test_settlements.py |
| Notifications | list, mark-read | test_notifications.py |
| Reports | daily-summary, farmer-summary | test_reports.py |
| Data Import | import farmers, template, preview | test_data_import.py |

### Test Categories

Each endpoint should have:
- **Positive tests**: Valid requests with expected responses
- **Negative tests**: Invalid inputs, missing fields, validation errors
- **Authorization tests**: Unauthenticated, wrong role, forbidden access
- **Pagination tests**: For list endpoints
- **Error handling tests**: Various error codes and messages

---

## Dependencies

### requirements.txt additions

```txt
# Testing dependencies (already present)
pytest>=7.0.0
pytest-cov>=4.0.0
requests>=2.28.0
faker>=18.0.0

# Pydantic for validation (already in main dependencies)
pydantic>=2.0.0
```

---

## Success Criteria

1. **Complete Playwright Removal**: No Playwright dependencies for API testing
2. **Type Safety**: All request/response payloads validated with Pydantic
3. **Comprehensive Coverage**: All API endpoints have test coverage
4. **Contract Testing**: Response schemas match API design document
5. **Authentication Flow**: JWT login/refresh fixtures work correctly
6. **Error Validation**: Standard error formats are validated
7. **Pagination Validation**: List endpoints validate pagination metadata
8. **Clean Architecture**: Separation of concerns between schemas, fixtures, and tests
