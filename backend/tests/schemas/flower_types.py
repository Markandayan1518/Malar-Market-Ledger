"""
Pydantic schemas for Flower Types API endpoints.

Based on docs/api-design.md Flower Types Module section.
"""

from typing import Optional
from pydantic import BaseModel, Field


class NestedFlowerType(BaseModel):
    """Nested flower type info in other responses."""
    name: str = Field(description="Flower type name in English")
    name_ta: Optional[str] = Field(default=None, description="Flower type name in Tamil")
    code: str = Field(description="Unique flower type code")
    unit: str = Field(description="Unit of measurement (e.g., kg)")


class FlowerTypeResponse(BaseModel):
    """Flower type response data structure."""
    id: str = Field(description="Flower type UUID")
    name: str = Field(description="Flower type name in English")
    name_ta: Optional[str] = Field(default=None, description="Flower type name in Tamil")
    code: str = Field(description="Unique flower type code")
    description: Optional[str] = Field(default=None, description="Description")
    unit: str = Field(description="Unit of measurement (e.g., kg)")
    is_active: bool = Field(default=True, description="Whether flower type is active")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class FlowerTypeCreate(BaseModel):
    """Create flower type request payload."""
    name: str = Field(description="Flower type name in English")
    name_ta: Optional[str] = Field(default=None, description="Flower type name in Tamil")
    code: str = Field(description="Unique flower type code")
    description: Optional[str] = Field(default=None, description="Description")
    unit: str = Field(description="Unit of measurement (e.g., kg)")


class FlowerTypeUpdate(BaseModel):
    """Update flower type request payload."""
    name: Optional[str] = Field(default=None, description="Flower type name in English")
    name_ta: Optional[str] = Field(default=None, description="Flower type name in Tamil")
    description: Optional[str] = Field(default=None, description="Description")
    unit: Optional[str] = Field(default=None, description="Unit of measurement (e.g., kg)")
    is_active: Optional[bool] = Field(default=None, description="Whether flower type is active")


class FlowerTypeSingleResponse(BaseModel):
    """Single flower type response wrapper."""
    success: bool = True
    data: FlowerTypeResponse
    message: Optional[str] = None
