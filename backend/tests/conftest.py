"""
Pytest Configuration and Shared Fixtures for Malar Market Digital Ledger Tests

This module provides shared fixtures for testing the REST API endpoints.
"""

import os
import pytest
import requests
from typing import Dict, Any, Optional
from faker import Faker

# Configuration
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "postgresql://user:password@localhost:5432/malar_market_ledger_test")

# Initialize Faker
fake = Faker()


# ==================== Configuration Fixtures ====================

@pytest.fixture(scope="session")
def base_url() -> str:
    """Return the API base URL from environment or default."""
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    """Return a requests session for making API calls."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ==================== Authentication Fixtures ====================

@pytest.fixture(scope="session")
def admin_credentials() -> Dict[str, str]:
    """Return admin user credentials for testing."""
    return {
        "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
        "password": os.getenv("TEST_ADMIN_PASSWORD", "admin123")
    }


@pytest.fixture(scope="session")
def staff_credentials() -> Dict[str, str]:
    """Return staff user credentials for testing."""
    return {
        "email": os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com"),
        "password": os.getenv("TEST_STAFF_PASSWORD", "staff123")
    }


@pytest.fixture(scope="session")
def farmer_credentials() -> Dict[str, str]:
    """Return farmer user credentials for testing."""
    return {
        "email": os.getenv("TEST_FARMER_EMAIL", "farmer1@malarmarket.com"),
        "password": os.getenv("TEST_FARMER_PASSWORD", "farmer123")
    }


@pytest.fixture(scope="session")
def admin_token(base_url, admin_credentials) -> Optional[str]:
    """Login as admin and return JWT token."""
    response = requests.post(
        f"{base_url}/auth/login",
        json=admin_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


@pytest.fixture(scope="session")
def staff_token(base_url, staff_credentials) -> Optional[str]:
    """Login as staff and return JWT token."""
    response = requests.post(
        f"{base_url}/auth/login",
        json=staff_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


@pytest.fixture(scope="session")
def farmer_token(base_url, farmer_credentials) -> Optional[str]:
    """Login as farmer and return JWT token."""
    response = requests.post(
        f"{base_url}/auth/login",
        json=farmer_credentials,
        timeout=30
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


@pytest.fixture
def admin_auth_header(admin_token) -> Dict[str, str]:
    """Return authorization header with admin token."""
    if admin_token:
        return {"Authorization": f"Bearer {admin_token}"}
    return {}


@pytest.fixture
def staff_auth_header(staff_token) -> Dict[str, str]:
    """Return authorization header with staff token."""
    if staff_token:
        return {"Authorization": f"Bearer {staff_token}"}
    return {}


@pytest.fixture
def farmer_auth_header(farmer_token) -> Dict[str, str]:
    """Return authorization header with farmer token."""
    if farmer_token:
        return {"Authorization": f"Bearer {farmer_token}"}
    return {}


# ==================== Sample Data Fixtures ====================

@pytest.fixture
def sample_farmer() -> Dict[str, Any]:
    """Return sample farmer data for testing."""
    return {
        "name": fake.name(),
        "phone": fake.phone_number()[:20],
        "address": fake.address()[:255],
        "village": fake.city()[:100],
        "taluk": fake.city_suffix()[:100],
        "district": fake.state()[:100],
        "pincode": fake.zipcode()[:10]
    }


@pytest.fixture
def sample_flower_type() -> Dict[str, Any]:
    """Return sample flower type data for testing."""
    return {
        "name": fake.word().capitalize(),
        "name_ta": "மலர்",
        "unit": "kg",
        "description": fake.sentence()
    }


@pytest.fixture
def sample_time_slot() -> Dict[str, Any]:
    """Return sample time slot data for testing."""
    return {
        "name": "Morning",
        "start_time": "04:00",
        "end_time": "09:00",
        "is_active": True
    }


@pytest.fixture
def sample_market_rate() -> Dict[str, Any]:
    """Return sample market rate data for testing."""
    return {
        "flower_type_id": "00000000-0000-0000-0000-000000000001",
        "time_slot_id": "00000000-0000-0000-0000-000000000001",
        "rate": round(fake.random_number(digits=3, fix_decimal=True), 2),
        "effective_from": fake.date_time_this_year().isoformat()
    }


@pytest.fixture
def sample_daily_entry() -> Dict[str, Any]:
    """Return sample daily entry data for testing."""
    return {
        "farmer_id": "00000000-0000-0000-0000-000000000001",
        "flower_type_id": "00000000-0000-0000-0000-000000000001",
        "time_slot_id": "00000000-0000-0000-0000-000000000001",
        "weight": round(fake.random_number(digits=2, fix_decimal=True), 2),
        "rate": round(fake.random_number(digits=3, fix_decimal=True), 2),
        "total_amount": round(fake.random_number(digits=4, fix_decimal=True), 2),
        "entry_date": fake.date().isoformat(),
        "notes": fake.sentence() if fake.boolean() else None
    }


@pytest.fixture
def sample_cash_advance() -> Dict[str, Any]:
    """Return sample cash advance data for testing."""
    return {
        "farmer_id": "00000000-0000-0000-0000-000000000001",
        "amount": round(fake.random_number(digits=4, fix_decimal=True), 2),
        "reason": fake.sentence(),
        "requested_date": fake.date().isoformat()
    }


@pytest.fixture
def sample_settlement() -> Dict[str, Any]:
    """Return sample settlement data for testing."""
    return {
        "farmer_id": "00000000-0000-0000-0000-000000000001",
        "period_start": fake.date().isoformat(),
        "period_end": fake.date().isoformat(),
        "total_dues": round(fake.random_number(digits=5, fix_decimal=True), 2),
        "total_advances": round(fake.random_number(digits=4, fix_decimal=True), 2),
        "net_amount": round(fake.random_number(digits=5, fix_decimal=True), 2)
    }


# ==================== Helper Functions ====================

def get_auth_header(token: str) -> Dict[str, str]:
    """Helper function to create authorization header."""
    return {"Authorization": f"Bearer {token}"}


def make_request(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    json: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    timeout: int = 30
) -> requests.Response:
    """Helper function to make HTTP requests."""
    session = requests.Session()
    
    if method.upper() == "GET":
        return session.get(url, headers=headers, params=params, timeout=timeout)
    elif method.upper() == "POST":
        return session.post(url, headers=headers, json=json, timeout=timeout)
    elif method.upper() == "PUT":
        return session.put(url, headers=headers, json=json, timeout=timeout)
    elif method.upper() == "PATCH":
        return session.patch(url, headers=headers, json=json, timeout=timeout)
    elif method.upper() == "DELETE":
        return session.delete(url, headers=headers, timeout=timeout)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")


# ==================== Pytest Configuration ====================

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "positive: mark test as positive test case")
    config.addinivalue_line("markers", "negative: mark test as negative test case")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "auth: mark test as authentication related")


def pytest_collection_modifyitems(config, items):
    """Modify test items during collection."""
    for item in items:
        # Add markers based on test name patterns
        if "unauthorized" in item.name or "forbidden" in item.name:
            item.add_marker(pytest.mark.negative)
        if "auth" in item.nodeid.lower():
            item.add_marker(pytest.mark.auth)
