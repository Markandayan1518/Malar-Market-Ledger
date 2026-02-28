"""
Pydantic schemas for Authentication API endpoints.

Based on docs/api-design.md Authentication Flow section.
"""

from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, EmailStr


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    STAFF = "staff"
    FARMER = "farmer"


class UserInToken(BaseModel):
    """User information returned in token responses."""
    id: str = Field(description="User UUID")
    email: str = Field(description="User email address")
    full_name: str = Field(description="User full name")
    role: UserRole = Field(description="User role")
    language_preference: str = Field(default="en", description="Preferred language code")


class LoginRequest(BaseModel):
    """Login request payload."""
    email: str = Field(description="User email address")
    password: str = Field(description="User password")


class RefreshTokenRequest(BaseModel):
    """Refresh token request payload."""
    refresh_token: str = Field(description="Valid refresh token")


class ForgotPasswordRequest(BaseModel):
    """Forgot password request payload."""
    email: str = Field(description="User email address")


class ResetPasswordRequest(BaseModel):
    """Reset password request payload."""
    token: str = Field(description="Password reset token")
    new_password: str = Field(description="New password")


class LoginResponseData(BaseModel):
    """Login response data structure."""
    access_token: str = Field(description="JWT access token")
    refresh_token: str = Field(description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration time in seconds")
    user: UserInToken = Field(description="User information")


class LoginResponse(BaseModel):
    """Full login response wrapper."""
    success: bool = True
    data: LoginResponseData
    message: str = Field(default="Login successful")


class RefreshTokenResponseData(BaseModel):
    """Refresh token response data structure."""
    access_token: str = Field(description="New JWT access token")
    refresh_token: str = Field(description="New JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration time in seconds")


class RefreshTokenResponse(BaseModel):
    """Full refresh token response wrapper."""
    success: bool = True
    data: RefreshTokenResponseData
    message: str = Field(default="Token refreshed successfully")


class LogoutResponse(BaseModel):
    """Logout response wrapper."""
    success: bool = True
    message: str = Field(default="Logout successful")


class ForgotPasswordResponse(BaseModel):
    """Forgot password response wrapper."""
    success: bool = True
    message: str = Field(default="Password reset email sent")


class ResetPasswordResponse(BaseModel):
    """Reset password response wrapper."""
    success: bool = True
    message: str = Field(default="Password reset successful")
