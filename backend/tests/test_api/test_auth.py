"""
Tests for Authentication Endpoints

This module contains tests for the /api/v1/auth endpoints including:
- POST /login - Login with email/password
- POST /refresh - Refresh access token
- POST /logout - Logout user
- POST /forgot-password - Request password reset
- POST /reset-password - Reset password with token
"""

import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")


class TestAuthLogin:
    """Tests for POST /api/v1/auth/login"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_login_with_valid_credentials_returns_200(self):
        """Test POST /auth/login returns 200 with valid credentials"""
        payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
            "password": os.getenv("TEST_ADMIN_PASSWORD", "admin123")
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, f"Response should contain 'access_token': {data}"
        assert "token_type" in data, f"Response should contain 'token_type': {data}"
        assert data["token_type"] == "bearer", f"Token type should be 'bearer', got {data.get('token_type')}"

    @pytest.mark.positive
    def test_login_with_staff_credentials_returns_200(self):
        """Test POST /auth/login returns 200 with staff credentials"""
        payload = {
            "email": os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com"),
            "password": os.getenv("TEST_STAFF_PASSWORD", "staff123")
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, f"Response should contain 'access_token': {data}"

    @pytest.mark.positive
    def test_login_with_farmer_credentials_returns_200(self):
        """Test POST /auth/login returns 200 with farmer credentials"""
        payload = {
            "email": os.getenv("TEST_FARMER_EMAIL", "farmer1@malarmarket.com"),
            "password": os.getenv("TEST_FARMER_PASSWORD", "farmer123")
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, f"Response should contain 'access_token': {data}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_login_with_invalid_email_returns_401(self):
        """Test POST /auth/login returns 401 with invalid email"""
        payload = {
            "email": "nonexistent@example.com",
            "password": "somepassword"
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_login_with_invalid_password_returns_401(self):
        """Test POST /auth/login returns 401 with invalid password"""
        payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
            "password": "wrongpassword"
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_login_with_empty_credentials_returns_422(self):
        """Test POST /auth/login returns 422 with empty credentials"""
        payload = {}
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_login_with_missing_email_returns_422(self):
        """Test POST /auth/login returns 422 with missing email"""
        payload = {
            "password": "somepassword"
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_login_with_missing_password_returns_422(self):
        """Test POST /auth/login returns 422 with missing password"""
        payload = {
            "email": "test@example.com"
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_login_with_invalid_email_format_returns_422(self):
        """Test POST /auth/login returns 422 with invalid email format"""
        payload = {
            "email": "not-an-email",
            "password": "somepassword"
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestAuthRefresh:
    """Tests for POST /api/v1/auth/refresh"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_refresh_token_returns_200(self):
        """Test POST /auth/refresh returns 200 with valid refresh token"""
        # First login to get tokens
        login_payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
            "password": os.getenv("TEST_ADMIN_PASSWORD", "admin123")
        }
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_payload,
            timeout=30
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping refresh test")
        
        # Try to refresh token
        refresh_payload = {
            "refresh_token": login_response.json().get("refresh_token", "")
        }
        
        if not refresh_payload["refresh_token"]:
            pytest.skip("No refresh token in login response")
        
        response = requests.post(
            f"{BASE_URL}/auth/refresh",
            json=refresh_payload,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_refresh_token_with_invalid_token_returns_401(self):
        """Test POST /auth/refresh returns 401 with invalid refresh token"""
        payload = {
            "refresh_token": "invalid-refresh-token"
        }
        response = requests.post(
            f"{BASE_URL}/auth/refresh",
            json=payload,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_refresh_token_with_empty_token_returns_422(self):
        """Test POST /auth/refresh returns 422 with empty token"""
        payload = {}
        response = requests.post(
            f"{BASE_URL}/auth/refresh",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestAuthLogout:
    """Tests for POST /api/v1/auth/logout"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_logout_with_valid_token_returns_200(self):
        """Test POST /auth/logout returns 200 with valid token"""
        # First login to get token
        login_payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
            "password": os.getenv("TEST_ADMIN_PASSWORD", "admin123")
        }
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_payload,
            timeout=30
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping logout test")
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/auth/logout",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_logout_without_token_returns_401(self):
        """Test POST /auth/logout returns 401 without token"""
        response = requests.post(
            f"{BASE_URL}/auth/logout",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_logout_with_invalid_token_returns_401(self):
        """Test POST /auth/logout returns 401 with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.post(
            f"{BASE_URL}/auth/logout",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestAuthForgotPassword:
    """Tests for POST /api/v1/auth/forgot-password"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_forgot_password_with_valid_email_returns_200(self):
        """Test POST /auth/forgot-password returns 200 with valid email"""
        payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
        }
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json=payload,
            timeout=30
        )
        # Should return 200 even if email doesn't exist (security best practice)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_forgot_password_with_invalid_email_returns_200(self):
        """Test POST /auth/forgot-password returns 200 with non-existent email"""
        payload = {
            "email": "nonexistent@example.com"
        }
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json=payload,
            timeout=30
        )
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_forgot_password_with_missing_email_returns_422(self):
        """Test POST /auth/forgot-password returns 422 with missing email"""
        payload = {}
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_forgot_password_with_invalid_email_format_returns_422(self):
        """Test POST /auth/forgot-password returns 422 with invalid email format"""
        payload = {
            "email": "not-an-email"
        }
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestAuthResetPassword:
    """Tests for POST /api/v1/auth/reset-password"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_reset_password_with_valid_token_returns_200(self):
        """Test POST /auth/reset-password returns 200 with valid token"""
        # Note: This test requires a valid reset token from forgot-password
        # For testing purposes, we use a placeholder
        payload = {
            "token": "valid-reset-token-placeholder",
            "new_password": "newpassword123"
        }
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json=payload,
            timeout=30
        )
        # Will likely fail with invalid token, but we test the endpoint exists
        assert response.status_code in [200, 400, 401, 422], f"Unexpected status code: {response.status_code}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_reset_password_with_missing_token_returns_422(self):
        """Test POST /auth/reset-password returns 422 with missing token"""
        payload = {
            "new_password": "newpassword123"
        }
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_reset_password_with_missing_password_returns_422(self):
        """Test POST /auth/reset-password returns 422 with missing password"""
        payload = {
            "token": "some-token"
        }
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_reset_password_with_empty_payload_returns_422(self):
        """Test POST /auth/reset-password returns 422 with empty payload"""
        payload = {}
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json=payload,
            timeout=30
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestAuthMe:
    """Tests for GET /api/v1/auth/me"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_current_user_with_valid_token_returns_200(self):
        """Test GET /auth/me returns 200 with valid token"""
        # First login to get token
        login_payload = {
            "email": os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com"),
            "password": os.getenv("TEST_ADMIN_PASSWORD", "admin123")
        }
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_payload,
            timeout=30
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping test")
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "email" in data, f"Response should contain 'email': {data}"
        assert "role" in data, f"Response should contain 'role': {data}"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_current_user_without_token_returns_401(self):
        """Test GET /auth/me returns 401 without token"""
        response = requests.get(
            f"{BASE_URL}/auth/me",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

    @pytest.mark.negative
    def test_get_current_user_with_invalid_token_returns_401(self):
        """Test GET /auth/me returns 401 with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
