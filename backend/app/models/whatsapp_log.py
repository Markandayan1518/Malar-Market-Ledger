"""WhatsApp log model for tracking message delivery."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WhatsappLog(Base):
    """
    WhatsApp log model for tracking message delivery.
    
    Stores logs of WhatsApp message delivery status.
    """
    __tablename__ = "whatsapp_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    notification_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("notifications.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    phone_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    delivery_status: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    notification = relationship(
        "Notification",
        back_populates="whatsapp_logs",
        foreign_keys="[WhatsappLog.notification_id]"
    )

    def __repr__(self) -> str:
        return f"<WhatsappLog(id={self.id}, phone={self.phone_number}, status={self.status})>"
