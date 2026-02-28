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
    page_size: int = Field(alias="per_page")
    total_items: int = Field(alias="total")
    total_pages: int
    has_next: bool
    has_previous: bool = Field(alias="has_prev")

    model_config = ConfigDict(populate_by_name=True)


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
    pagination_or_page: "int | PaginationMeta",
    page_size: Optional[int] = None,
    total_items: Optional[int] = None,
    message: Optional[str] = None
) -> PaginatedResponse[T]:
    """
    Create a paginated response.
    
    Supports two calling patterns:
    1. With PaginationMeta object: create_paginated_response(data, pagination)
    2. With individual args: create_paginated_response(data, page, page_size, total_items)
    """
    # Check if second argument is a PaginationMeta object
    if isinstance(pagination_or_page, PaginationMeta):
        pagination = pagination_or_page
    else:
        # Build PaginationMeta from individual arguments
        page = pagination_or_page
        if page_size is None or total_items is None:
            raise ValueError("page_size and total_items are required when page is provided as int")
        total_pages = (total_items + page_size - 1) // page_size if page_size > 0 else 1
        pagination = PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )
    
    return PaginatedResponse(
        success=True,
        data=data,
        pagination=pagination,
        message=message
    )
