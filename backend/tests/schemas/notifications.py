"""
Pydantic schemas for Notifications API endpoints.

Based on docs/api-design.md Notifications Module section.
"""

from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

from tests.schemas.common import PaginationMeta


class NotificationStatus(str, Enum):
    """Notification status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationChannel(str, Enum):
    """Notification channel enumeration."""
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"


class NotificationResponse(BaseModel):
    """Notification response data structure."""
    id: str = Field(description="Notification UUID")
    type: str = Field(description="Notification type")
    channel: NotificationChannel = Field(description="Notification channel")
    status: NotificationStatus = Field(description="Notification status")
    title: str = Field(description="Notification title in English")
    title_ta: Optional[str] = Field(default=None, description="Notification title in Tamil")
    message: str = Field(description="Notification message in English")
    message_ta: Optional[str] = Field(default=None, description="Notification message in Tamil")
    sent_at: Optional[str] = Field(default=None, description="Sent timestamp (ISO 8601)")
    created_at: str = Field(description="Creation timestamp (ISO 8601)")


class NotificationMarkReadResponse(BaseModel):
    """Mark notification as read response wrapper."""
    success: bool = True
    message: str = Field(default="Notification marked as read")


class NotificationListResponse(BaseModel):
    """Notification list response with pagination."""
    success: bool = True
    data: List[NotificationResponse]
    pagination: PaginationMeta
