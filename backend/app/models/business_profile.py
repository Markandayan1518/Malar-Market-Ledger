"""Business profile model for white-labeling/invoice customization."""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusinessProfile(Base):
    """
    Business profile model for white-labeling.
    
    Stores customizable business information for invoices and reports.
    """
    __tablename__ = "business_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )

    shop_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    owner_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    address_line1: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    address_line2: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    pincode: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    alternate_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    gst_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    pan_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    bank_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    bank_account_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    bank_ifsc_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    bank_branch: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    upi_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    logo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    invoice_prefix: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="INV"
    )

    invoice_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    invoice_terms: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
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

    def __repr__(self) -> str:
        return f"<BusinessProfile(shop_name={self.shop_name}, owner={self.owner_name})>"

    def get_full_address(self) -> str:
        """Get formatted full address."""
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        parts.append(f"{self.city}, {self.state} - {self.pincode}")
        return "\n".join(parts)
