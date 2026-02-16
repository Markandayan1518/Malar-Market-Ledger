"""User model for authentication and authorization."""

from datetime import datetime
from enum import Enum
from typing import Optional
import uuid

from sqlalchemy import String, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    STAFF = "staff"
    FARMER = "farmer"


class User(Base):
    """
    User model for authentication and authorization.
    
    Stores application users with role-based access control.
    """
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        unique=True,
        nullable=True
    )
    
    role: Mapped[UserRole] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    language_preference: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="en"
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
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    # Relationships
    farmer = relationship(
        "Farmer",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    daily_entries = relationship(
        "DailyEntry",
        back_populates="created_by_user",
        cascade="all, delete-orphan"
    )
    
    settlements_created = relationship(
        "Settlement",
        back_populates="created_by_user",
        foreign_keys="[Settlement.created_by]",
        cascade="all, delete-orphan"
    )
    
    cash_advances_created = relationship(
        "CashAdvance",
        back_populates="created_by_user",
        foreign_keys="[CashAdvance.created_by]",
        cascade="all, delete-orphan"
    )
    
    settlements_approved = relationship(
        "Settlement",
        back_populates="approved_by_user",
        foreign_keys="[Settlement.approved_by]"
    )
    
    cash_advances_approved = relationship(
        "CashAdvance",
        back_populates="approved_by_user",
        foreign_keys="[CashAdvance.approved_by]"
    )
    
    security_logs = relationship(
        "SecurityLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
