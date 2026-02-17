"""Invoice API endpoints."""

import uuid
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import (
    CurrentUser, CurrentStaffOrAdminUser, CurrentAdminUser, DatabaseSession
)
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.farmer import Farmer
from app.models.settlement import Settlement
from app.models.business_profile import BusinessProfile
from app.schemas.all_schemas import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse,
    InvoicePaymentRequest, InvoiceCancelRequest, InvoiceItemResponse,
    PaginationMeta
)
from app.services.invoice_service import get_invoice_service

router = APIRouter(prefix="/invoices", tags=["Invoices"])


async def get_active_business_profile(db: AsyncSession) -> Optional[BusinessProfile]:
    """Get the active business profile for white-labeling."""
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.is_active == True)
    )
    return result.scalar_one_or_none()


def generate_invoice_number(prefix: str = "INV") -> str:
    """Generate a unique invoice number."""
    date_part = datetime.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{date_part}-{unique_part}"


@router.get("/", response_model=InvoiceListResponse)
async def list_invoices(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[InvoiceStatus] = None,
    farmer_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None
):
    """List invoices with filtering and pagination."""
    
    # Base query with relationships
    query = select(Invoice).options(
        selectinload(Invoice.items),
        selectinload(Invoice.farmer)
    ).where(Invoice.deleted_at == None)
    
    # Apply filters
    if status:
        query = query.where(Invoice.status == status)
    
    if farmer_id:
        query = query.where(Invoice.farmer_id == farmer_id)
    
    if start_date:
        query = query.where(Invoice.invoice_date >= start_date)
    
    if end_date:
        query = query.where(Invoice.invoice_date <= end_date)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Invoice.invoice_number.ilike(search_term),
                Invoice.customer_name.ilike(search_term),
                Invoice.customer_phone.ilike(search_term)
            )
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Invoice.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    # Build response
    invoice_responses = []
    for inv in invoices:
        inv_dict = {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "farmer_id": inv.farmer_id,
            "customer_name": inv.customer_name,
            "customer_phone": inv.customer_phone,
            "customer_address": inv.customer_address,
            "invoice_date": inv.invoice_date,
            "due_date": inv.due_date,
            "status": inv.status,
            "subtotal": inv.subtotal,
            "tax_rate": inv.tax_rate,
            "tax_amount": inv.tax_amount,
            "discount": inv.discount,
            "total_amount": inv.total_amount,
            "amount_paid": inv.amount_paid,
            "balance_due": inv.balance_due,
            "notes": inv.notes,
            "terms": inv.terms,
            "settlement_id": inv.settlement_id,
            "created_by": inv.created_by,
            "paid_at": inv.paid_at,
            "cancelled_at": inv.cancelled_at,
            "cancelled_reason": inv.cancelled_reason,
            "created_at": inv.created_at,
            "updated_at": inv.updated_at,
            "items": [
                InvoiceItemResponse(
                    id=item.id,
                    description=item.description,
                    quantity=item.quantity,
                    unit=item.unit,
                    rate=item.rate,
                    total=item.total,
                    flower_type_id=item.flower_type_id,
                    sort_order=item.sort_order
                ) for item in inv.items
            ]
        }
        invoice_responses.append(InvoiceResponse(**inv_dict))
    
    return InvoiceListResponse(
        success=True,
        data=invoice_responses,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=(total + page_size - 1) // page_size
        )
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get a single invoice by ID."""
    
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
        .where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        farmer_id=invoice.farmer_id,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        customer_address=invoice.customer_address,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount=invoice.discount,
        total_amount=invoice.total_amount,
        amount_paid=invoice.amount_paid,
        balance_due=invoice.balance_due,
        notes=invoice.notes,
        terms=invoice.terms,
        settlement_id=invoice.settlement_id,
        created_by=invoice.created_by,
        paid_at=invoice.paid_at,
        cancelled_at=invoice.cancelled_at,
        cancelled_reason=invoice.cancelled_reason,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        items=[
            InvoiceItemResponse(
                id=item.id,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                rate=item.rate,
                total=item.total,
                flower_type_id=item.flower_type_id,
                sort_order=item.sort_order
            ) for item in invoice.items
        ]
    )


@router.post("/", response_model=InvoiceResponse)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Create a new invoice."""
    
    # Get business profile for invoice prefix
    business = await get_active_business_profile(db)
    prefix = business.invoice_prefix if business else "INV"
    
    # Create invoice
    invoice = Invoice(
        id=str(uuid.uuid4()),
        invoice_number=generate_invoice_number(prefix),
        farmer_id=invoice_data.farmer_id,
        customer_name=invoice_data.customer_name,
        customer_phone=invoice_data.customer_phone,
        customer_address=invoice_data.customer_address,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        tax_rate=invoice_data.tax_rate,
        discount=invoice_data.discount,
        notes=invoice_data.notes,
        terms=invoice_data.terms,
        settlement_id=invoice_data.settlement_id,
        status=InvoiceStatus.DRAFT,
        created_by=current_user.id
    )
    
    # Create invoice items
    subtotal = Decimal("0")
    for idx, item_data in enumerate(invoice_data.items):
        item_total = item_data.quantity * item_data.rate
        subtotal += item_total
        
        item = InvoiceItem(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit=item_data.unit,
            rate=item_data.rate,
            total=item_total,
            daily_entry_id=item_data.daily_entry_id,
            flower_type_id=item_data.flower_type_id,
            sort_order=idx
        )
        db.add(item)
    
    # Calculate totals
    invoice.subtotal = subtotal
    invoice.tax_amount = (subtotal * invoice_data.tax_rate / 100).quantize(Decimal("0.01"))
    invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice_data.discount
    invoice.balance_due = invoice.total_amount
    
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    # Reload with items
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice.id)
    )
    invoice = result.scalar_one()
    
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        farmer_id=invoice.farmer_id,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        customer_address=invoice.customer_address,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount=invoice.discount,
        total_amount=invoice.total_amount,
        amount_paid=invoice.amount_paid,
        balance_due=invoice.balance_due,
        notes=invoice.notes,
        terms=invoice.terms,
        settlement_id=invoice.settlement_id,
        created_by=invoice.created_by,
        paid_at=invoice.paid_at,
        cancelled_at=invoice.cancelled_at,
        cancelled_reason=invoice.cancelled_reason,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        items=[
            InvoiceItemResponse(
                id=item.id,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                rate=item.rate,
                total=item.total,
                flower_type_id=item.flower_type_id,
                sort_order=item.sort_order
            ) for item in invoice.items
        ]
    )


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Update an existing invoice."""
    
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
        .where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot update a paid invoice")
    
    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot update a cancelled invoice")
    
    # Update fields
    update_data = invoice_data.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    # Update items if provided
    if invoice_data.items is not None:
        # Delete existing items
        for item in invoice.items:
            await db.delete(item)
        
        # Create new items
        subtotal = Decimal("0")
        for idx, item_data in enumerate(invoice_data.items):
            item_total = item_data.quantity * item_data.rate
            subtotal += item_total
            
            item = InvoiceItem(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit=item_data.unit,
                rate=item_data.rate,
                total=item_total,
                daily_entry_id=item_data.daily_entry_id,
                flower_type_id=item_data.flower_type_id,
                sort_order=idx
            )
            db.add(item)
        
        invoice.subtotal = subtotal
        invoice.tax_amount = (subtotal * invoice.tax_rate / 100).quantize(Decimal("0.01"))
        invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice.discount
        invoice.balance_due = invoice.total_amount - invoice.amount_paid
    
    invoice.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invoice)
    
    # Reload with items
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice.id)
    )
    invoice = result.scalar_one()
    
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        farmer_id=invoice.farmer_id,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        customer_address=invoice.customer_address,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount=invoice.discount,
        total_amount=invoice.total_amount,
        amount_paid=invoice.amount_paid,
        balance_due=invoice.balance_due,
        notes=invoice.notes,
        terms=invoice.terms,
        settlement_id=invoice.settlement_id,
        created_by=invoice.created_by,
        paid_at=invoice.paid_at,
        cancelled_at=invoice.cancelled_at,
        cancelled_reason=invoice.cancelled_reason,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        items=[
            InvoiceItemResponse(
                id=item.id,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                rate=item.rate,
                total=item.total,
                flower_type_id=item.flower_type_id,
                sort_order=item.sort_order
            ) for item in invoice.items
        ]
    )


@router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Send invoice (change status from draft to pending)."""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id).where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft invoices can be sent")
    
    invoice.status = InvoiceStatus.PENDING
    invoice.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "Invoice sent successfully"}


@router.post("/{invoice_id}/payment")
async def record_payment(
    invoice_id: str,
    payment_data: InvoicePaymentRequest,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Record a payment for the invoice."""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id).where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot record payment for cancelled invoice")
    
    # Update payment
    invoice.amount_paid = invoice.amount_paid + payment_data.amount
    invoice.balance_due = invoice.total_amount - invoice.amount_paid
    
    # Check if fully paid
    if invoice.balance_due <= 0:
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.utcnow()
        invoice.balance_due = Decimal("0")
    
    invoice.updated_at = datetime.utcnow()
    await db.commit()
    
    return {
        "success": True,
        "message": "Payment recorded successfully",
        "balance_due": invoice.balance_due,
        "status": invoice.status
    }


@router.post("/{invoice_id}/cancel")
async def cancel_invoice(
    invoice_id: str,
    cancel_data: InvoiceCancelRequest,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Cancel an invoice."""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id).where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot cancel a paid invoice")
    
    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Invoice is already cancelled")
    
    invoice.status = InvoiceStatus.CANCELLED
    invoice.cancelled_at = datetime.utcnow()
    invoice.cancelled_reason = cancel_data.reason
    invoice.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "Invoice cancelled"}


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    db: DatabaseSession,
    current_user: CurrentAdminUser
):
    """Soft delete an invoice (admin only)."""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id).where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice.deleted_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "Invoice deleted"}


@router.get("/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser,
    language: str = Query("en", pattern="^(en|ta)$")
):
    """Generate PDF for an invoice."""
    
    # Get invoice
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
        .where(Invoice.deleted_at == None)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get business profile
    business = await get_active_business_profile(db)
    
    if not business:
        # Use default values if no business profile
        business_dict = {
            "shop_name": "Malar Market",
            "owner_name": "",
            "address_line1": "",
            "address_line2": "",
            "city": "",
            "state": "",
            "pincode": "",
            "phone": "",
            "email": "",
            "gst_number": "",
            "invoice_prefix": "INV"
        }
    else:
        business_dict = {
            "shop_name": business.shop_name,
            "owner_name": business.owner_name,
            "address_line1": business.address_line1,
            "address_line2": business.address_line2,
            "city": business.city,
            "state": business.state,
            "pincode": business.pincode,
            "phone": business.phone,
            "email": business.email,
            "gst_number": business.gst_number,
            "bank_name": business.bank_name,
            "bank_account_number": business.bank_account_number,
            "bank_ifsc_code": business.bank_ifsc_code,
            "bank_branch": business.bank_branch,
            "upi_id": business.upi_id,
            "invoice_notes": business.invoice_notes,
            "invoice_terms": business.invoice_terms
        }
    
    # Prepare invoice data
    invoice_dict = {
        "invoice_number": invoice.invoice_number,
        "customer_name": invoice.customer_name,
        "customer_phone": invoice.customer_phone,
        "customer_address": invoice.customer_address,
        "invoice_date": invoice.invoice_date,
        "due_date": invoice.due_date,
        "subtotal": float(invoice.subtotal),
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": float(invoice.tax_amount),
        "discount": float(invoice.discount),
        "total_amount": float(invoice.total_amount),
        "amount_paid": float(invoice.amount_paid),
        "balance_due": float(invoice.balance_due),
        "notes": invoice.notes,
        "terms": invoice.terms
    }
    
    # Prepare items data
    items_data = [
        {
            "description": item.description,
            "quantity": float(item.quantity),
            "unit": item.unit,
            "rate": float(item.rate),
            "total": float(item.total)
        }
        for item in invoice.items
    ]
    
    # Generate PDF
    pdf_service = get_invoice_service(language)
    pdf_bytes = pdf_service.generate_invoice_pdf(business_dict, invoice_dict, items_data)
    
    # Return as streaming response
    filename = f"invoice_{invoice.invoice_number}.pdf"
    
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
