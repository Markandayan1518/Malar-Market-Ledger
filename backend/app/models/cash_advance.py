"""Cash advance model for managing farmer advances."""

from datetime import datetime, date
from enum import Enum
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, DateTime, Date, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AdvanceStatus(str, Enum):
    """Cash advance status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CashAdvance(Base):
    """
    Cash advance model for managing farmer advances.
    
    Tracks cash advances given to farmers with approval workflow.
    """
    __tablename__ = "cash_advances"

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
    
    amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    advance_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    
    status: Mapped[AdvanceStatus] = mapped_column(
        String(20),
        nullable=False,
        default=AdvanceStatus.PENDING,
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
        back_populates="cash_advances"
    )
    
    created_by_user = relationship(
        "User",
        back_populates="cash_advances_created",
        foreign_keys="[CashAdvance.created_by]"
    )
    
    approved_by_user = relationship(
        "User",
        back_populates="cash_advances_approved",
        foreign_keys="[CashAdvance.approved_by]"
    )

    def __repr__(self) -> str:
        return f"<CashAdvance(id={self.id}, amount={self.amount}, status={self.status})>"
