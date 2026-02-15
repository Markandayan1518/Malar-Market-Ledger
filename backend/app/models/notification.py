"""Notification model for managing notifications."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationStatus(str, Enum):
    """Notification status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationChannel(str, Enum):
    """Notification channel enumeration."""
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"


class Notification(Base):
    """
    Notification model for managing notifications.
    
    Stores notification records for WhatsApp and in-app.
    """
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    farmer_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    
    channel: Mapped[NotificationChannel] = mapped_column(
        String(20),
        nullable=False
    )
    
    status: Mapped[NotificationStatus] = mapped_column(
        String(20),
        nullable=False,
        default=NotificationStatus.PENDING,
        index=True
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    title_ta: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    message_ta: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    template_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="notifications"
    )

    farmer = relationship(
        "Farmer",
        back_populates="notifications"
    )

    whatsapp_logs = relationship(
        "WhatsappLog",
        back_populates="notification",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.type}, status={self.status})>"
