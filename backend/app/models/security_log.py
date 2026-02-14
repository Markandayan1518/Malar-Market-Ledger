"""Security log model for audit logging."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import INET

from app.database import Base


class SecurityLog(Base):
    """
    Security log model for audit logging.
    
    Stores audit logs for security and compliance.
    """
    __tablename__ = "security_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    
    entity_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False
    )
    
    old_values: Mapped[Optional[dict]] = mapped_column(
        Text,
        nullable=True
    )
    
    new_values: Mapped[Optional[dict]] = mapped_column(
        Text,
        nullable=True
    )
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        INET,
        nullable=True
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="security_logs",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<SecurityLog(id={self.id}, action={self.action}, entity={self.entity_type})>"
