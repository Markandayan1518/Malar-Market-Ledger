"""
HTTP API Client for testing using requests library.

This module provides a type-safe API client for making HTTP requests
with automatic JWT token handling and response validation.
"""

import os
from typing import Optional, Dict, Any, Union
from decimal import Decimal

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from pydantic import BaseModel


class APIClientError(Exception):
    """Base exception for API client errors."""
    pass


class AuthenticationError(APIClientError):
    """Raised when authentication fails."""
    pass


class TokenExpiredError(APIClientError):
    """Raised when the access token has expired."""
    pass


class APIClient:
    """
    HTTP API client with JWT authentication support.
    
    Uses the requests library for HTTP communication.
    Handles login, token refresh, and authenticated requests.
    """
    
    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        retries: int = 3,
        backoff_factor: float = 0.5,
    ):
        """
        Initialize the API client.
        
        Args:
            base_url: Base URL for the API (e.g., http://localhost:8000/api/v1)
            timeout: Request timeout in seconds
            retries: Number of retry attempts for failed requests
            backoff_factor: Backoff factor for retries
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        
        # Create session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Disable proxies for localhost requests to avoid proxy interference
        if "localhost" in self.base_url or "127.0.0.1" in self.base_url:
            self.session.proxies = {
                "http": None,
                "https": None,
            }
            self.session.trust_env = False  # Ignore system proxy settings
    
    def _get_headers(self, include_auth: bool = True) -> Dict[str, str]:
        """
        Get request headers.
        
        Args:
            include_auth: Whether to include Authorization header
            
        Returns:
            Dictionary of headers
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if include_auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def _build_url(self, endpoint: str) -> str:
        """
        Build full URL from endpoint.
        
        Args:
            endpoint: API endpoint (e.g., /auth/login)
            
        Returns:
            Full URL
        """
        endpoint = endpoint.lstrip("/")
        return f"{self.base_url}/{endpoint}"
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate and obtain tokens.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Login response data
            
        Raises:
            AuthenticationError: If login fails
        """
        url = self._build_url("/auth/login")
        payload = {"email": email, "password": password}
        
        response = self.session.post(
            url,
            json=payload,
            headers=self._get_headers(include_auth=False),
            timeout=self.timeout,
        )
        
        if response.status_code == 401:
            raise AuthenticationError("Invalid credentials")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Handle both wrapped (success/data) and direct response formats
        if data.get("success") and "data" in data:
            response_data = data["data"]
        else:
            response_data = data
        
        # Store tokens
        self.access_token = response_data.get("access_token")
        self.refresh_token = response_data.get("refresh_token")
        self.user_data = response_data.get("user")
        
        if not self.access_token:
            raise AuthenticationError("No access_token in response")
        
        return data
    
    def refresh_access_token(self) -> Dict[str, Any]:
        """
        Refresh the access token using the refresh token.
        
        Returns:
            Refresh response data
            
        Raises:
            AuthenticationError: If refresh fails
        """
        if not self.refresh_token:
            raise AuthenticationError("No refresh token available")
        
        url = self._build_url("/auth/refresh")
        payload = {"refresh_token": self.refresh_token}
        
        response = self.session.post(
            url,
            json=payload,
            headers=self._get_headers(include_auth=False),
            timeout=self.timeout,
        )
        
        if response.status_code == 401:
            raise AuthenticationError("Refresh token invalid or expired")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Handle both wrapped and direct response formats
        if data.get("success") and "data" in data:
            response_data = data["data"]
        else:
            response_data = data
        
        # Update tokens
        self.access_token = response_data.get("access_token")
        self.refresh_token = response_data.get("refresh_token")
        
        return data
    
    def logout(self) -> Dict[str, Any]:
        """
        Logout and invalidate tokens.
        
        Returns:
            Logout response data
        """
        url = self._build_url("/auth/logout")
        
        response = self.session.post(
            url,
            headers=self._get_headers(),
            timeout=self.timeout,
        )
        
        response.raise_for_status()
        
        # Clear tokens
        self.access_token = None
        self.refresh_token = None
        self.user_data = None
        
        return response.json()
    
    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> requests.Response:
        """
        Make a GET request.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            **kwargs: Additional request arguments
            
        Returns:
            Response object
        """
        url = self._build_url(endpoint)
        response = self.session.get(
            url,
            params=params,
            headers=self._get_headers(),
            timeout=self.timeout,
            **kwargs,
        )
        return response
    
    def post(
        self,
        endpoint: str,
        data: Optional[Union[Dict[str, Any], BaseModel]] = None,
        **kwargs,
    ) -> requests.Response:
        """
        Make a POST request.
        
        Args:
            endpoint: API endpoint
            data: Request body (dict or Pydantic model)
            **kwargs: Additional request arguments
            
        Returns:
            Response object
        """
        url = self._build_url(endpoint)
        
        # Convert Pydantic model to dict
        if isinstance(data, BaseModel):
            json_data = data.model_dump(mode="json", by_alias=True)
        else:
            json_data = data
        
        response = self.session.post(
            url,
            json=json_data,
            headers=self._get_headers(),
            timeout=self.timeout,
            **kwargs,
        )
        return response
    
    def put(
        self,
        endpoint: str,
        data: Optional[Union[Dict[str, Any], BaseModel]] = None,
        **kwargs,
    ) -> requests.Response:
        """
        Make a PUT request.
        
        Args:
            endpoint: API endpoint
            data: Request body (dict or Pydantic model)
            **kwargs: Additional request arguments
            
        Returns:
            Response object
        """
        url = self._build_url(endpoint)
        
        # Convert Pydantic model to dict
        if isinstance(data, BaseModel):
            json_data = data.model_dump(mode="json", by_alias=True)
        else:
            json_data = data
        
        response = self.session.put(
            url,
            json=json_data,
            headers=self._get_headers(),
            timeout=self.timeout,
            **kwargs,
        )
        return response
    
    def patch(
        self,
        endpoint: str,
        data: Optional[Union[Dict[str, Any], BaseModel]] = None,
        **kwargs,
    ) -> requests.Response:
        """
        Make a PATCH request.
        
        Args:
            endpoint: API endpoint
            data: Request body (dict or Pydantic model)
            **kwargs: Additional request arguments
            
        Returns:
            Response object
        """
        url = self._build_url(endpoint)
        
        # Convert Pydantic model to dict
        if isinstance(data, BaseModel):
            json_data = data.model_dump(mode="json", by_alias=True)
        else:
            json_data = data
        
        response = self.session.patch(
            url,
            json=json_data,
            headers=self._get_headers(),
            timeout=self.timeout,
            **kwargs,
        )
        return response
    
    def delete(
        self,
        endpoint: str,
        **kwargs,
    ) -> requests.Response:
        """
        Make a DELETE request.
        
        Args:
            endpoint: API endpoint
            **kwargs: Additional request arguments
            
        Returns:
            Response object
        """
        url = self._build_url(endpoint)
        response = self.session.delete(
            url,
            headers=self._get_headers(),
            timeout=self.timeout,
            **kwargs,
        )
        return response
    
    def close(self):
        """Close the session."""
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def create_api_client(
    base_url: Optional[str] = None,
    timeout: int = 30,
) -> APIClient:
    """
    Factory function to create an API client.
    
    Args:
        base_url: Base URL for the API. Defaults to TEST_API_URL env var
                  or http://localhost:8000/api/v1
        timeout: Request timeout in seconds
        
    Returns:
        Configured APIClient instance
    """
    if base_url is None:
        base_url = os.environ.get(
            "TEST_API_URL",
            "http://localhost:8000/api/v1"
        )
    
    return APIClient(base_url=base_url, timeout=timeout)
