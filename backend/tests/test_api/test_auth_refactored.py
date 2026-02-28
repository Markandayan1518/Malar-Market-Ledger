"""
Tests for Authentication Endpoints

This module contains tests for the /api/v1/auth endpoints including:
- POST /login - Login with email/password
- POST /refresh - Refresh access token
- POST /logout - Logout user
- POST /forgot-password - Request password reset
- POST /reset-password - Reset password with token

Uses Pydantic schemas for request serialization and response validation.
"""

import pytest
import os

from tests.utils.api_client import APIClient, create_api_client, AuthenticationError
from tests.utils.response_validators import (
    assert_status_code,
    validate_success_response,
    validate_error_response,
    validate_response_schema,
    extract_data,
)
from tests.schemas.common import (
    HTTP_200_OK,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_422_UNPROCESSABLE_ENTITY,
    ERROR_AUTHENTICATION_FAILED,
    ERROR_VALIDATION,
)
from tests.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LoginResponseData,
    RefreshTokenRequest,
    RefreshTokenResponse,
    LogoutResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserInToken,
)


# Test credentials from environment
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@malarmarket.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")
TEST_STAFF_EMAIL = os.getenv("TEST_STAFF_EMAIL", "staff@malarmarket.com")
TEST_STAFF_PASSWORD = os.getenv("TEST_STAFF_PASSWORD", "staff123")
TEST_FARMER_EMAIL = os.getenv("TEST_FARMER_EMAIL", "farmer1@malarmarket.com")
TEST_FARMER_PASSWORD = os.getenv("TEST_FARMER_PASSWORD", "farmer123")


class TestAuthLogin:
    """Tests for POST /api/v1/auth/login"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_login_with_valid_admin_credentials_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 200 with valid admin credentials"""
        # Create login request using Pydantic model
        login_request = LoginRequest(
            email=TEST_ADMIN_EMAIL,
            password=TEST_ADMIN_PASSWORD
        )
        
        # Make request
        response = api_client_v2.post("/auth/login", data=login_request)
        
        # Assert status code
        assert_status_code(response, HTTP_200_OK)
        
        # Validate response schema
        data = validate_success_response(response)
        
        # Validate nested data structure
        response_data = LoginResponseData.model_validate(data["data"])
        
        # Assert required fields
        assert response_data.access_token is not None
        assert response_data.refresh_token is not None
        assert response_data.token_type == "bearer"
        assert response_data.expires_in > 0
        assert response_data.user.email == TEST_ADMIN_EMAIL
        assert response_data.user.role in ["admin", "staff", "farmer"]

    @pytest.mark.positive
    def test_login_with_valid_staff_credentials_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 200 with valid staff credentials"""
        login_request = LoginRequest(
            email=TEST_STAFF_EMAIL,
            password=TEST_STAFF_PASSWORD
        )
        
        response = api_client_v2.post("/auth/login", data=login_request)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        response_data = LoginResponseData.model_validate(data["data"])
        
        assert response_data.access_token is not None
        assert response_data.user.email == TEST_STAFF_EMAIL

    @pytest.mark.positive
    def test_login_with_valid_farmer_credentials_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 200 with valid farmer credentials"""
        login_request = LoginRequest(
            email=TEST_FARMER_EMAIL,
            password=TEST_FARMER_PASSWORD
        )
        
        response = api_client_v2.post("/auth/login", data=login_request)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        response_data = LoginResponseData.model_validate(data["data"])
        
        assert response_data.access_token is not None
        assert response_data.user.email == TEST_FARMER_EMAIL

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_login_with_invalid_email_returns_401(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 401 with invalid email"""
        login_request = LoginRequest(
            email="nonexistent@example.com",
            password="somepassword"
        )
        
        response = api_client_v2.post("/auth/login", data=login_request)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)
        
        # Validate error response
        error_response = validate_error_response(
            response,
            expected_code=ERROR_AUTHENTICATION_FAILED
        )
        assert error_response.success is False

    @pytest.mark.negative
    def test_login_with_invalid_password_returns_401(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 401 with invalid password"""
        login_request = LoginRequest(
            email=TEST_ADMIN_EMAIL,
            password="wrongpassword"
        )
        
        response = api_client_v2.post("/auth/login", data=login_request)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)
        error_response = validate_error_response(response)
        assert error_response.success is False

    @pytest.mark.negative
    def test_login_with_empty_credentials_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 422 with empty credentials"""
        response = api_client_v2.post("/auth/login", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)
        error_response = validate_error_response(response)
        assert error_response.success is False

    @pytest.mark.negative
    def test_login_with_missing_email_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 422 with missing email"""
        response = api_client_v2.post("/auth/login", data={"password": "somepassword"})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_login_with_missing_password_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/login returns 422 with missing password"""
        response = api_client_v2.post("/auth/login", data={"email": "test@example.com"})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)


class TestAuthRefresh:
    """Tests for POST /api/v1/auth/refresh"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_refresh_token_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/refresh returns 200 with valid refresh token"""
        # First login to get tokens
        login_request = LoginRequest(
            email=TEST_ADMIN_EMAIL,
            password=TEST_ADMIN_PASSWORD
        )
        login_response = api_client_v2.post("/auth/login", data=login_request)
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping refresh test")
        
        login_data = login_response.json()
        refresh_token = login_data.get("data", {}).get("refresh_token")
        
        if not refresh_token:
            pytest.skip("No refresh token in login response")
        
        # Refresh token
        refresh_request = RefreshTokenRequest(refresh_token=refresh_token)
        response = api_client_v2.post("/auth/refresh", data=refresh_request)
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate new tokens are returned
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_refresh_token_with_invalid_token_returns_401(self, api_client_v2: APIClient):
        """Test POST /auth/refresh returns 401 with invalid refresh token"""
        refresh_request = RefreshTokenRequest(refresh_token="invalid-refresh-token")
        response = api_client_v2.post("/auth/refresh", data=refresh_request)
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)

    @pytest.mark.negative
    def test_refresh_token_with_empty_token_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/refresh returns 422 with empty token"""
        response = api_client_v2.post("/auth/refresh", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)


class TestAuthLogout:
    """Tests for POST /api/v1/auth/logout"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_logout_with_valid_token_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/logout returns 200 with valid token"""
        # First login to get token
        login_request = LoginRequest(
            email=TEST_ADMIN_EMAIL,
            password=TEST_ADMIN_PASSWORD
        )
        login_response = api_client_v2.post("/auth/login", data=login_request)
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping logout test")
        
        login_data = login_response.json()
        token = login_data.get("data", {}).get("access_token")
        
        # Set token and logout
        api_client_v2.access_token = token
        response = api_client_v2.post("/auth/logout")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert data.get("message") == "Logout successful"

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_logout_without_token_returns_401(self, api_client_v2: APIClient):
        """Test POST /auth/logout returns 401 without token"""
        response = api_client_v2.post("/auth/logout")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)

    @pytest.mark.negative
    def test_logout_with_invalid_token_returns_401(self, api_client_v2: APIClient):
        """Test POST /auth/logout returns 401 with invalid token"""
        api_client_v2.access_token = "invalid-token"
        response = api_client_v2.post("/auth/logout")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestAuthForgotPassword:
    """Tests for POST /api/v1/auth/forgot-password"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_forgot_password_with_valid_email_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/forgot-password returns 200 with valid email"""
        request = ForgotPasswordRequest(email=TEST_ADMIN_EMAIL)
        response = api_client_v2.post("/auth/forgot-password", data=request)
        
        # Should return 200 even if email doesn't exist (security best practice)
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        assert "message" in data

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_forgot_password_with_nonexistent_email_returns_200(self, api_client_v2: APIClient):
        """Test POST /auth/forgot-password returns 200 with non-existent email"""
        # Should return 200 for security (don't reveal if email exists)
        request = ForgotPasswordRequest(email="nonexistent@example.com")
        response = api_client_v2.post("/auth/forgot-password", data=request)
        
        assert_status_code(response, HTTP_200_OK)

    @pytest.mark.negative
    def test_forgot_password_with_missing_email_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/forgot-password returns 422 with missing email"""
        response = api_client_v2.post("/auth/forgot-password", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)


class TestAuthResetPassword:
    """Tests for POST /api/v1/auth/reset-password"""

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_reset_password_with_missing_token_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/reset-password returns 422 with missing token"""
        response = api_client_v2.post("/auth/reset-password", data={"new_password": "newpassword123"})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_reset_password_with_missing_password_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/reset-password returns 422 with missing password"""
        response = api_client_v2.post("/auth/reset-password", data={"token": "some-token"})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)

    @pytest.mark.negative
    def test_reset_password_with_empty_payload_returns_422(self, api_client_v2: APIClient):
        """Test POST /auth/reset-password returns 422 with empty payload"""
        response = api_client_v2.post("/auth/reset-password", data={})
        
        assert_status_code(response, HTTP_422_UNPROCESSABLE_ENTITY)


class TestAuthMe:
    """Tests for GET /api/v1/auth/me"""

    # ==================== POSITIVE TESTS ====================

    @pytest.mark.positive
    def test_get_current_user_with_valid_token_returns_200(self, api_client_v2: APIClient):
        """Test GET /auth/me returns 200 with valid token"""
        # First login to get token
        login_request = LoginRequest(
            email=TEST_ADMIN_EMAIL,
            password=TEST_ADMIN_PASSWORD
        )
        login_response = api_client_v2.post("/auth/login", data=login_request)
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping test")
        
        login_data = login_response.json()
        token = login_data.get("data", {}).get("access_token")
        
        # Set token and get current user
        api_client_v2.access_token = token
        response = api_client_v2.get("/auth/me")
        
        assert_status_code(response, HTTP_200_OK)
        data = validate_success_response(response)
        
        # Validate user data
        user_data = UserInToken.model_validate(data["data"])
        assert user_data.email == TEST_ADMIN_EMAIL
        assert user_data.role in ["admin", "staff", "farmer"]

    # ==================== NEGATIVE TESTS ====================

    @pytest.mark.negative
    def test_get_current_user_without_token_returns_401(self, api_client_v2: APIClient):
        """Test GET /auth/me returns 401 without token"""
        response = api_client_v2.get("/auth/me")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)

    @pytest.mark.negative
    def test_get_current_user_with_invalid_token_returns_401(self, api_client_v2: APIClient):
        """Test GET /auth/me returns 401 with invalid token"""
        api_client_v2.access_token = "invalid-token"
        response = api_client_v2.get("/auth/me")
        
        assert_status_code(response, HTTP_401_UNAUTHORIZED)


class TestAuthClientIntegration:
    """Tests using the APIClient login/logout methods"""

    @pytest.mark.positive
    def test_client_login_sets_tokens(self, api_client_v2: APIClient):
        """Test that APIClient.login() properly sets tokens"""
        api_client_v2.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        assert api_client_v2.access_token is not None
        assert api_client_v2.refresh_token is not None
        assert api_client_v2.user_data is not None
        assert api_client_v2.user_data.get("email") == TEST_ADMIN_EMAIL

    @pytest.mark.positive
    def test_client_refresh_tokens(self, api_client_v2: APIClient):
        """Test that APIClient.refresh_access_token() works"""
        # Login first
        api_client_v2.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        old_access_token = api_client_v2.access_token
        
        # Refresh
        api_client_v2.refresh_access_token()
        
        # New tokens should be different
        assert api_client_v2.access_token is not None
        assert api_client_v2.access_token != old_access_token

    @pytest.mark.positive
    def test_client_logout_clears_tokens(self, api_client_v2: APIClient):
        """Test that APIClient.logout() clears tokens"""
        # Login first
        api_client_v2.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        # Logout
        api_client_v2.logout()
        
        # Tokens should be cleared
        assert api_client_v2.access_token is None
        assert api_client_v2.refresh_token is None
        assert api_client_v2.user_data is None

    @pytest.mark.negative
    def test_client_login_invalid_credentials_raises_error(self, api_client_v2: APIClient):
        """Test that APIClient.login() raises error with invalid credentials"""
        with pytest.raises(AuthenticationError):
            api_client_v2.login("invalid@example.com", "wrongpassword")
