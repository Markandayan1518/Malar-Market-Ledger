"""
Pydantic schemas for Users API endpoints.

Based on docs/api-design.md Users Module section.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from tests.schemas.auth import UserRole


class UserResponse(BaseModel):
    """User response data structure."""
    id: str = Field(description="User UUID")
    email: str = Field(description="User email address")
    full_name: str = Field(description="User full name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    role: UserRole = Field(description="User role")
    is_active: bool = Field(default=True, description="Whether user is active")
    email_verified: bool = Field(default=False, description="Whether email is verified")
    language_preference: str = Field(default="en", description="Preferred language code")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class UserCreate(BaseModel):
    """Create user request payload."""
    email: str = Field(description="User email address")
    password: str = Field(description="User password")
    full_name: str = Field(description="User full name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    role: UserRole = Field(default=UserRole.STAFF, description="User role")
    language_preference: str = Field(default="en", description="Preferred language code")


class UserUpdate(BaseModel):
    """Update user request payload."""
    full_name: Optional[str] = Field(default=None, description="User full name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    language_preference: Optional[str] = Field(default=None, description="Preferred language code")


class UserSingleResponse(BaseModel):
    """Single user response wrapper."""
    success: bool = True
    data: UserResponse
    message: Optional[str] = None


class UserCreateResponse(BaseModel):
    """Create user response wrapper."""
    success: bool = True
    data: UserResponse
    message: str = Field(default="User created successfully")


class UserUpdateResponse(BaseModel):
    """Update user response wrapper."""
    success: bool = True
    data: UserResponse
    message: str = Field(default="User updated successfully")


class UserDeleteResponse(BaseModel):
    """Delete user response wrapper."""
    success: bool = True
    message: str = Field(default="User deleted successfully")
