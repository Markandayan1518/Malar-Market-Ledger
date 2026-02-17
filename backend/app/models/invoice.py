"""Invoice model for generating invoices."""

from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
import enum

from sqlalchemy import String, Boolean, DateTime, Date, Text, Numeric, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InvoiceStatus(str, enum.Enum):
    """Invoice status enum."""
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class Invoice(Base):
    """
    Invoice model for billing farmers or customers.
    """
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )

    invoice_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    farmer_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("farmers.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    customer_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    customer_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    customer_address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    invoice_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    due_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )

    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus),
        nullable=False,
        default=InvoiceStatus.DRAFT
    )

    subtotal: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    tax_rate: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=0.0
    )

    tax_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    discount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    total_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    amount_paid: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    balance_due: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    terms: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    settlement_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("settlements.id", ondelete="SET NULL"),
        nullable=True
    )

    created_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    cancelled_reason: Mapped[Optional[str]] = mapped_column(
        Text,
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
        nullable=True,
        index=True
    )

    # Relationships
    items: Mapped[List["InvoiceItem"]] = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.sort_order"
    )

    farmer = relationship("Farmer", back_populates="invoices")
    settlement = relationship("Settlement", back_populates="invoices")

    def __repr__(self) -> str:
        return f"<Invoice(number={self.invoice_number}, status={self.status.value})>"

    def calculate_totals(self):
        """Calculate invoice totals from items."""
        self.subtotal = sum(item.total for item in self.items)
        self.tax_amount = round(self.subtotal * float(self.tax_rate) / 100, 2)
        self.total_amount = self.subtotal + self.tax_amount - float(self.discount)
        self.balance_due = self.total_amount - float(self.amount_paid)


class InvoiceItem(Base):
    """
    Invoice line item model.
    """
    __tablename__ = "invoice_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )

    invoice_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    quantity: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="kg"
    )

    rate: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    total: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    daily_entry_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("daily_entries.id", ondelete="SET NULL"),
        nullable=True
    )

    flower_type_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("flower_types.id", ondelete="SET NULL"),
        nullable=True
    )

    sort_order: Mapped[int] = mapped_column(
        nullable=False,
        default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
    daily_entry = relationship("DailyEntry")
    flower_type = relationship("FlowerType")

    def __repr__(self) -> str:
        return f"<InvoiceItem(description={self.description}, total={self.total})>"

    def calculate_total(self):
        """Calculate item total."""
        self.total = float(self.quantity) * float(self.rate)
