"""Farmer-Product association model for linking farmers to their crops."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FarmerProduct(Base):
    """
    Association model linking farmers to the flower types they grow.
    
    This enables smart suggestions during daily entry - when a farmer
    is selected, the system can auto-suggest flowers they typically bring.
    """
    __tablename__ = "farmer_products"
    __table_args__ = (
        UniqueConstraint("farmer_id", "flower_type_id", name="uq_farmer_flower"),
        Index("ix_farmer_products_farmer_id", "farmer_id"),
        Index("ix_farmer_products_flower_type_id", "flower_type_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    farmer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False
    )
    
    flower_type_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("flower_types.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Track entry count for smart suggestions (optional enhancement)
    entry_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )
    
    last_entry_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
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
        back_populates="farmer_products"
    )
    
    flower_type = relationship(
        "FlowerType",
        back_populates="farmer_products"
    )

    def __repr__(self) -> str:
        return f"<FarmerProduct(farmer_id={self.farmer_id}, flower_type_id={self.flower_type_id})>"
