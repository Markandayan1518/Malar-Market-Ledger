"""Daily entry model for flower entries."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, DateTime, Date, Time, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailyEntry(Base):
    """
    Daily entry model for flower entries.
    
    Stores daily flower entries from farmers with time-based pricing.
    """
    __tablename__ = "daily_entries"

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
    
    flower_type_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("flower_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    time_slot_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("time_slots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    entry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    
    entry_time: Mapped[datetime.time] = mapped_column(
        Time,
        nullable=False
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
    
    commission_rate: Mapped[float] = mapped_column(
        Numeric(5, 2),
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
        back_populates="daily_entries"
    )
    
    flower_type = relationship(
        "FlowerType",
        back_populates="daily_entries"
    )
    
    time_slot = relationship(
        "TimeSlot",
        back_populates="daily_entries"
    )
    
    created_by_user = relationship(
        "User",
        back_populates="daily_entries",
        foreign_keys="[DailyEntry.created_by]"
    )
    
    settlement_items = relationship(
        "SettlementItem",
        back_populates="daily_entry",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<DailyEntry(id={self.id}, date={self.entry_date}, quantity={self.quantity})>"
