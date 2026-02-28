"""
Common Pydantic schemas for API response envelopes.

Based on docs/api-design.md standard response formats.
"""

from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field


T = TypeVar("T", bound=BaseModel)


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses."""
    page: int = Field(ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(ge=1, le=100, description="Items per page (max 100)")
    total_items: int = Field(ge=0, description="Total number of items")
    total_pages: int = Field(ge=0, description="Total number of pages")
    has_next: bool = Field(description="Whether there is a next page")
    has_previous: bool = Field(description="Whether there is a previous page")


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


class ErrorDetail(BaseModel):
    """Individual error detail for validation errors."""
    field: str = Field(description="Field that caused the error")
    message: str = Field(description="Error message")


class ErrorBody(BaseModel):
    """Error body structure."""
    code: str = Field(description="Error code identifier")
    message: str = Field(description="Human-readable error message")
    details: Optional[List[ErrorDetail]] = Field(
        default=None,
        description="Optional detailed error information"
    )


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    success: bool = False
    error: ErrorBody
    message: str = Field(description="Error message at top level")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response wrapper."""
    success: bool = True
    data: List[Any] = Field(default_factory=list, description="Array of items")
    pagination: PaginationMeta
    message: Optional[str] = None


# HTTP Status Code Constants
HTTP_200_OK = 200
HTTP_201_CREATED = 201
HTTP_204_NO_CONTENT = 204
HTTP_400_BAD_REQUEST = 400
HTTP_401_UNAUTHORIZED = 401
HTTP_403_FORBIDDEN = 403
HTTP_404_NOT_FOUND = 404
HTTP_409_CONFLICT = 409
HTTP_422_UNPROCESSABLE_ENTITY = 422
HTTP_429_TOO_MANY_REQUESTS = 429
HTTP_500_INTERNAL_SERVER_ERROR = 500
HTTP_503_SERVICE_UNAVAILABLE = 503


# Error Code Constants from api-design.md
ERROR_VALIDATION = "VALIDATION_ERROR"
ERROR_AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
ERROR_TOKEN_EXPIRED = "TOKEN_EXPIRED"
ERROR_REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID"
ERROR_PERMISSION_DENIED = "PERMISSION_DENIED"
ERROR_RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
ERROR_RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
ERROR_INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION"
ERROR_NO_APPLICABLE_RATE = "NO_APPLICABLE_RATE"
ERROR_RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
ERROR_INTERNAL_SERVER = "INTERNAL_SERVER_ERROR"
ERROR_SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
