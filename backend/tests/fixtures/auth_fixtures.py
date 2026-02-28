"""
Authentication fixtures for API testing.

This module provides pytest fixtures for JWT authentication,
including login, token refresh, and authenticated API clients.
"""

import os
import pytest
from typing import Dict, Any, Optional

from tests.utils.api_client import APIClient, create_api_client, AuthenticationError


# Test user credentials from environment or defaults
TEST_ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@malar.com")
TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "adminpassword123")

TEST_STAFF_EMAIL = os.environ.get("TEST_STAFF_EMAIL", "staff@malar.com")
TEST_STAFF_PASSWORD = os.environ.get("TEST_STAFF_PASSWORD", "staffpassword123")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    """
    Get the API base URL for testing.
    
    Returns:
        API base URL from environment or default
    """
    return os.environ.get(
        "TEST_API_URL",
        "http://localhost:8000/api/v1"
    )


@pytest.fixture(scope="function")
def api_client(api_base_url: str) -> APIClient:
    """
    Create an unauthenticated API client.
    
    Yields:
        APIClient instance without authentication
    """
    client = create_api_client(base_url=api_base_url)
    yield client
    client.close()


@pytest.fixture(scope="function")
def admin_client(api_base_url: str) -> APIClient:
    """
    Create an authenticated API client with admin credentials.
    
    Yields:
        Authenticated APIClient instance with admin role
    
    Raises:
        AuthenticationError: If login fails
    """
    client = create_api_client(base_url=api_base_url)
    try:
        client.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    except AuthenticationError:
        client.close()
        raise
    
    yield client
    
    try:
        client.logout()
    except Exception:
        pass
    finally:
        client.close()


@pytest.fixture(scope="function")
def staff_client(api_base_url: str) -> APIClient:
    """
    Create an authenticated API client with staff credentials.
    
    Yields:
        Authenticated APIClient instance with staff role
    
    Raises:
        AuthenticationError: If login fails
    """
    client = create_api_client(base_url=api_base_url)
    try:
        client.login(TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD)
    except AuthenticationError:
        client.close()
        raise
    
    yield client
    
    try:
        client.logout()
    except Exception:
        pass
    finally:
        client.close()


@pytest.fixture(scope="function")
def admin_auth_headers(admin_client: APIClient) -> Dict[str, str]:
    """
    Get authentication headers for admin user.
    
    Args:
        admin_client: Authenticated admin API client
        
    Returns:
        Dictionary with Authorization header
    """
    return {
        "Authorization": f"Bearer {admin_client.access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


@pytest.fixture(scope="function")
def staff_auth_headers(staff_client: APIClient) -> Dict[str, str]:
    """
    Get authentication headers for staff user.
    
    Args:
        staff_client: Authenticated staff API client
        
    Returns:
        Dictionary with Authorization header
    """
    return {
        "Authorization": f"Bearer {staff_client.access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


@pytest.fixture(scope="function")
def admin_tokens(admin_client: APIClient) -> Dict[str, Optional[str]]:
    """
    Get admin user tokens.
    
    Args:
        admin_client: Authenticated admin API client
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    return {
        "access_token": admin_client.access_token,
        "refresh_token": admin_client.refresh_token,
    }


@pytest.fixture(scope="function")
def staff_tokens(staff_client: APIClient) -> Dict[str, Optional[str]]:
    """
    Get staff user tokens.
    
    Args:
        staff_client: Authenticated staff API client
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    return {
        "access_token": staff_client.access_token,
        "refresh_token": staff_client.refresh_token,
    }


@pytest.fixture(scope="function")
def admin_user_data(admin_client: APIClient) -> Optional[Dict[str, Any]]:
    """
    Get admin user data from login response.
    
    Args:
        admin_client: Authenticated admin API client
        
    Returns:
        User data dictionary or None
    """
    return admin_client.user_data


@pytest.fixture(scope="function")
def staff_user_data(staff_client: APIClient) -> Optional[Dict[str, Any]]:
    """
    Get staff user data from login response.
    
    Args:
        staff_client: Authenticated staff API client
        
    Returns:
        User data dictionary or None
    """
    return staff_client.user_data
