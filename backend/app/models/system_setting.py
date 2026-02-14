"""System setting model for managing configuration."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemSetting(Base):
    """
    System setting model for managing configuration.
    
    Stores system-wide configuration settings.
    """
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    value_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<SystemSetting(key={self.key}, value_type={self.value_type})>"
