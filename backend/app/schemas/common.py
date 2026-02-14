"""Common Pydantic schemas for API responses."""

from datetime import datetime
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from pydantic import EmailStr

from app.models.user import UserRole


T = TypeVar("T", bound=BaseModel)


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper."""
    success: bool = True
    data: Optional[T] = None
    message: str


class ErrorDetail(BaseModel):
    """Error detail for validation errors."""
    field: str
    message: str


class ErrorResponse(BaseModel, Generic[T]):
    """Standard error response wrapper."""
    success: bool = False
    error: dict[str, Any] = Field(default_factory=dict)
    message: str


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response wrapper."""
    success: bool = True
    data: List[T]
    pagination: PaginationMeta
    message: Optional[str] = None


def create_success_response(
    data: Optional[T] = None,
    message: str = "Operation successful"
) -> SuccessResponse[T]:
    """Create a success response."""
    return SuccessResponse(success=True, data=data, message=message)


def create_error_response(
    message: str,
    code: str = "ERROR",
    details: Optional[List[ErrorDetail]] = None
) -> ErrorResponse:
    """Create an error response."""
    return ErrorResponse(
        success=False,
        error={"code": code, "message": message, "details": details},
        message=message
    )


def create_paginated_response(
    data: List[T],
    page: int,
    page_size: int,
    total_items: int,
    message: Optional[str] = None
) -> PaginatedResponse[T]:
    """Create a paginated response."""
    total_pages = (total_items + page_size - 1) // page_size if page_size > 0 else 1
    
    return PaginatedResponse(
        success=True,
        data=data,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ),
        message=message
    )
