"""
Response validation utilities for API testing.

This module provides functions to validate HTTP responses against
Pydantic schemas and assert expected status codes.
"""

from typing import Type, TypeVar, Optional, Dict, Any, List
from decimal import Decimal

import requests
from pydantic import BaseModel, ValidationError

from tests.schemas.common import (
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
    ErrorBody,
    ErrorDetail,
)


T = TypeVar("T", bound=BaseModel)


class ResponseValidationError(Exception):
    """Raised when response validation fails."""
    
    def __init__(self, message: str, errors: Optional[List[Dict]] = None):
        super().__init__(message)
        self.errors = errors or []


def assert_status_code(
    response: requests.Response,
    expected_code: int,
    message: Optional[str] = None,
) -> None:
    """
    Assert that response status code matches expected.
    
    Args:
        response: HTTP response object
        expected_code: Expected status code
        message: Optional custom error message
        
    Raises:
        AssertionError: If status codes don't match
    """
    actual = response.status_code
    if actual != expected_code:
        try:
            body = response.json()
        except Exception:
            body = response.text
        
        error_msg = message or f"Expected status {expected_code}, got {actual}"
        raise AssertionError(f"{error_msg}\nResponse body: {body}")


def validate_response_schema(
    response: requests.Response,
    schema: Type[T],
) -> T:
    """
    Validate response body against a Pydantic schema.
    
    Args:
        response: HTTP response object
        schema: Pydantic model class to validate against
        
    Returns:
        Validated Pydantic model instance
        
    Raises:
        ResponseValidationError: If validation fails
    """
    try:
        data = response.json()
    except Exception as e:
        raise ResponseValidationError(f"Failed to parse JSON response: {e}")
    
    try:
        return schema.model_validate(data)
    except ValidationError as e:
        errors = e.errors()
        raise ResponseValidationError(
            f"Response validation failed for {schema.__name__}",
            errors=errors
        )


def validate_success_response(
    response: requests.Response,
    data_schema: Optional[Type[BaseModel]] = None,
) -> Dict[str, Any]:
    """
    Validate a standard success response envelope.
    
    Args:
        response: HTTP response object
        data_schema: Optional Pydantic schema for the data field
        
    Returns:
        Parsed response data dictionary
        
    Raises:
        ResponseValidationError: If validation fails
    """
    try:
        data = response.json()
    except Exception as e:
        raise ResponseValidationError(f"Failed to parse JSON response: {e}")
    
    # Check success flag
    if not data.get("success"):
        raise ResponseValidationError(
            f"Response success=False, expected True. "
            f"Error: {data.get('error', data.get('message', 'Unknown error'))}"
        )
    
    # Validate data field if schema provided
    if data_schema and "data" in data:
        try:
            data_schema.model_validate(data["data"])
        except ValidationError as e:
            raise ResponseValidationError(
                f"Data validation failed for {data_schema.__name__}",
                errors=e.errors()
            )
    
    return data


def validate_error_response(
    response: requests.Response,
    expected_code: Optional[str] = None,
    expected_status: Optional[int] = None,
) -> ErrorResponse:
    """
    Validate a standard error response envelope.
    
    Args:
        response: HTTP response object
        expected_code: Expected error code (e.g., "VALIDATION_ERROR")
        expected_status: Expected HTTP status code
        
    Returns:
        Validated ErrorResponse model
        
    Raises:
        ResponseValidationError: If validation fails
    """
    if expected_status:
        assert_status_code(response, expected_status)
    
    error_response = validate_response_schema(response, ErrorResponse)
    
    if expected_code and error_response.error.code != expected_code:
        raise ResponseValidationError(
            f"Expected error code '{expected_code}', "
            f"got '{error_response.error.code}'"
        )
    
    return error_response


def validate_paginated_response(
    response: requests.Response,
    item_schema: Optional[Type[BaseModel]] = None,
) -> Dict[str, Any]:
    """
    Validate a paginated list response.
    
    Args:
        response: HTTP response object
        item_schema: Optional Pydantic schema for list items
        
    Returns:
        Parsed response data dictionary
        
    Raises:
        ResponseValidationError: If validation fails
    """
    try:
        data = response.json()
    except Exception as e:
        raise ResponseValidationError(f"Failed to parse JSON response: {e}")
    
    # Check success flag
    if not data.get("success"):
        raise ResponseValidationError(
            f"Response success=False, expected True. "
            f"Error: {data.get('error', data.get('message', 'Unknown error'))}"
        )
    
    # Validate pagination metadata
    if "pagination" not in data:
        raise ResponseValidationError("Missing 'pagination' field in response")
    
    try:
        PaginationMeta.model_validate(data["pagination"])
    except ValidationError as e:
        raise ResponseValidationError(
            "Pagination metadata validation failed",
            errors=e.errors()
        )
    
    # Validate items if schema provided
    if item_schema and "data" in data:
        items = data["data"]
        if not isinstance(items, list):
            raise ResponseValidationError("'data' field should be a list")
        
        for i, item in enumerate(items):
            try:
                item_schema.model_validate(item)
            except ValidationError as e:
                raise ResponseValidationError(
                    f"Item {i} validation failed for {item_schema.__name__}",
                    errors=e.errors()
                )
    
    return data


def assert_pagination_meta(
    response_data: Dict[str, Any],
    expected_page: Optional[int] = None,
    expected_page_size: Optional[int] = None,
    expected_total_items: Optional[int] = None,
    min_total_items: Optional[int] = None,
) -> PaginationMeta:
    """
    Assert pagination metadata values.
    
    Args:
        response_data: Response data dictionary
        expected_page: Expected page number
        expected_page_size: Expected page size
        expected_total_items: Expected total items count
        min_total_items: Minimum expected total items
        
    Returns:
        Validated PaginationMeta model
        
    Raises:
        AssertionError: If assertions fail
        ResponseValidationError: If validation fails
    """
    if "pagination" not in response_data:
        raise ResponseValidationError("Missing 'pagination' field")
    
    try:
        pagination = PaginationMeta.model_validate(response_data["pagination"])
    except ValidationError as e:
        raise ResponseValidationError(
            "Pagination validation failed",
            errors=e.errors()
        )
    
    if expected_page is not None and pagination.page != expected_page:
        raise AssertionError(
            f"Expected page {expected_page}, got {pagination.page}"
        )
    
    if expected_page_size is not None and pagination.page_size != expected_page_size:
        raise AssertionError(
            f"Expected page_size {expected_page_size}, got {pagination.page_size}"
        )
    
    if expected_total_items is not None and pagination.total_items != expected_total_items:
        raise AssertionError(
            f"Expected total_items {expected_total_items}, got {pagination.total_items}"
        )
    
    if min_total_items is not None and pagination.total_items < min_total_items:
        raise AssertionError(
            f"Expected at least {min_total_items} items, got {pagination.total_items}"
        )
    
    return pagination


def assert_error_detail(
    error_response: ErrorResponse,
    field: str,
    message_contains: Optional[str] = None,
) -> None:
    """
    Assert that error response contains a specific field error.
    
    Args:
        error_response: Validated ErrorResponse model
        field: Expected field name in error details
        message_contains: Optional substring to check in error message
        
    Raises:
        AssertionError: If assertion fails
    """
    if not error_response.error.details:
        raise AssertionError("Error response has no details")
    
    for detail in error_response.error.details:
        if detail.field == field:
            if message_contains and message_contains not in detail.message:
                raise AssertionError(
                    f"Error message '{detail.message}' does not contain '{message_contains}'"
                )
            return
    
    fields = [d.field for d in error_response.error.details]
    raise AssertionError(
        f"Field '{field}' not found in error details. "
        f"Available fields: {fields}"
    )


def extract_data(response: requests.Response) -> Any:
    """
    Extract the data field from a success response.
    
    Args:
        response: HTTP response object
        
    Returns:
        Data field value
        
    Raises:
        ResponseValidationError: If extraction fails
    """
    try:
        data = response.json()
    except Exception as e:
        raise ResponseValidationError(f"Failed to parse JSON response: {e}")
    
    if not data.get("success"):
        raise ResponseValidationError(
            f"Response indicates failure: {data.get('error', data.get('message'))}"
        )
    
    return data.get("data")


def extract_pagination(response: requests.Response) -> PaginationMeta:
    """
    Extract and validate pagination metadata from response.
    
    Args:
        response: HTTP response object
        
    Returns:
        PaginationMeta model instance
        
    Raises:
        ResponseValidationError: If extraction fails
    """
    try:
        data = response.json()
    except Exception as e:
        raise ResponseValidationError(f"Failed to parse JSON response: {e}")
    
    if "pagination" not in data:
        raise ResponseValidationError("Missing 'pagination' field")
    
    try:
        return PaginationMeta.model_validate(data["pagination"])
    except ValidationError as e:
        raise ResponseValidationError(
            "Pagination validation failed",
            errors=e.errors()
        )
