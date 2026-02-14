"""Time slot model for time-based pricing."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Time, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TimeSlot(Base):
    """
    Time slot model for time-based pricing.
    
    Defines time slots for market rate application.
    """
    __tablename__ = "time_slots"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    name_ta: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    start_time: Mapped[datetime.time] = mapped_column(
        Time,
        nullable=False
    )
    
    end_time: Mapped[datetime.time] = mapped_column(
        Time,
        nullable=False
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

    # Relationships
    daily_entries = relationship(
        "DailyEntry",
        back_populates="time_slot",
        cascade="all, delete-orphan"
    )
    
    market_rates = relationship(
        "MarketRate",
        back_populates="time_slot",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<TimeSlot(id={self.id}, name={self.name}, {self.start_time}-{self.end_time})>"
