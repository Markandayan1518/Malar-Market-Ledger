"""Market rate model for time-based pricing."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, DateTime, Date, Index, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MarketRate(Base):
    """
    Market rate model for time-based pricing.
    
    Stores rates for flower types by time slot and date.
    """
    __tablename__ = "market_rates"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    flower_type_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("flower_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    time_slot_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("time_slots.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    rate_per_unit: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    effective_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    
    expiry_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
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
    flower_type = relationship(
        "FlowerType",
        back_populates="market_rates"
    )
    
    time_slot = relationship(
        "TimeSlot",
        back_populates="market_rates"
    )

    # Unique constraint
    __table_args__ = (
        UniqueConstraint(
            'flower_type_id',
            'time_slot_id',
            'effective_date',
            name='uq_market_rates_flower_time_date'
        ),
    )

    def __repr__(self) -> str:
        return f"<MarketRate(id={self.id}, rate={self.rate_per_unit}, effective={self.effective_date})>"
