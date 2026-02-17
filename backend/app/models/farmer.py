"""Farmer model for managing farmer information."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Farmer(Base):
    """
    Farmer model for managing farmer information and balances.
    
    Stores farmer details linked to user accounts.
    """
    __tablename__ = "farmers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=True,
        index=True
    )
    
    farmer_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    village: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    
    whatsapp_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    current_balance: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    total_advances: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    total_settlements: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
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

    # Relationships
    user = relationship(
        "User",
        back_populates="farmer",
        uselist=False
    )
    
    daily_entries = relationship(
        "DailyEntry",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )
    
    cash_advances = relationship(
        "CashAdvance",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )
    
    settlements = relationship(
        "Settlement",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )
    
    invoices = relationship(
        "Invoice",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )
    
    notifications = relationship(
        "Notification",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Farmer(id={self.id}, code={self.farmer_code}, name={self.name})>"
