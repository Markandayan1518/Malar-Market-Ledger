"""
Pydantic schemas for Time Slots API endpoints.

Based on docs/api-design.md Time Slots Module section.
"""

from typing import Optional
from pydantic import BaseModel, Field


class NestedTimeSlot(BaseModel):
    """Nested time slot info in other responses."""
    name: str = Field(description="Time slot name in English")
    name_ta: Optional[str] = Field(default=None, description="Time slot name in Tamil")
    start_time: str = Field(description="Start time (HH:MM:SS)")
    end_time: str = Field(description="End time (HH:MM:SS)")


class TimeSlotResponse(BaseModel):
    """Time slot response data structure."""
    id: str = Field(description="Time slot UUID")
    name: str = Field(description="Time slot name in English")
    name_ta: Optional[str] = Field(default=None, description="Time slot name in Tamil")
    start_time: str = Field(description="Start time (HH:MM:SS)")
    end_time: str = Field(description="End time (HH:MM:SS)")
    is_active: bool = Field(default=True, description="Whether time slot is active")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(description="Last update timestamp (ISO 8601)")


class TimeSlotSingleResponse(BaseModel):
    """Single time slot response wrapper."""
    success: bool = True
    data: TimeSlotResponse
    message: Optional[str] = None
