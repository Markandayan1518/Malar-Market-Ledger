"""Flower type model for managing flower varieties."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FlowerType(Base):
    """
    Flower type model for managing flower varieties.
    
    Master table for flower types with bilingual support.
    """
    __tablename__ = "flower_types"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )
    
    name_ta: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    unit: Mapped[str] = mapped_column(
        String(20),
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
        back_populates="flower_type",
        cascade="all, delete-orphan"
    )
    
    market_rates = relationship(
        "MarketRate",
        back_populates="flower_type",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FlowerType(id={self.id}, code={self.code}, name={self.name})>"
