"""Settlement model for managing farmer settlements."""

from datetime import datetime, date
from enum import Enum
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, DateTime, Date, Text, Index, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SettlementStatus(str, Enum):
    """Settlement status enumeration."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PAID = "paid"


class Settlement(Base):
    """
    Settlement model for managing farmer settlements.
    
    Stores settlement records with complex financial calculations.
    """
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    farmer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("farmers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    settlement_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    
    settlement_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    
    period_start: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    
    period_end: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    
    total_entries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    total_quantity: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    gross_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    total_commission: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    total_fees: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    total_advances: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )
    
    net_payable: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    status: Mapped[SettlementStatus] = mapped_column(
        String(20),
        nullable=False,
        default=SettlementStatus.DRAFT,
        index=True
    )
    
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    created_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
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
    farmer = relationship(
        "Farmer",
        back_populates="settlements"
    )
    
    created_by_user = relationship(
        "User",
        back_populates="settlements_created",
        foreign_keys="[Settlement.created_by]"
    )
    
    approved_by_user = relationship(
        "User",
        back_populates="settlements_approved",
        foreign_keys="[Settlement.approved_by]"
    )
    
    settlement_items = relationship(
        "SettlementItem",
        back_populates="settlement",
        cascade="all, delete-orphan"
    )
    
    invoices = relationship(
        "Invoice",
        back_populates="settlement"
    )

    def __repr__(self) -> str:
        return f"<Settlement(id={self.id}, number={self.settlement_number}, status={self.status})>"


class SettlementItem(Base):
    """
    Settlement item model for individual entries in settlements.
    
    Links daily entries to settlements.
    """
    __tablename__ = "settlement_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    settlement_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("settlements.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    daily_entry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("daily_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    quantity: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    rate_per_unit: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    total_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    commission_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    net_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    settlement = relationship(
        "Settlement",
        back_populates="settlement_items"
    )
    
    daily_entry = relationship(
        "DailyEntry",
        back_populates="settlement_items"
    )

    def __repr__(self) -> str:
        return f"<SettlementItem(id={self.id}, entry_id={self.daily_entry_id}, amount={self.net_amount})>"
