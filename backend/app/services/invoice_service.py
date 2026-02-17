"""Invoice PDF generation service with white-labeling support."""

import io
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    PageBreak, KeepTogether, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas

from app.services.font_manager import get_font_manager
from app.services.report_templates import (
    get_template, ReportTemplates, ColorScheme, PDFLayout,
    PDFTypography, PDFTableStyle
)

logger = logging.getLogger(__name__)


class InvoiceText:
    """English text templates for invoices."""
    
    INVOICE = "INVOICE"
    TAX_INVOICE = "TAX INVOICE"
    
    BILL_FROM = "Bill From"
    BILL_TO = "Bill To"
    
    INVOICE_NUMBER = "Invoice No."
    INVOICE_DATE = "Invoice Date"
    DUE_DATE = "Due Date"
    
    DESCRIPTION = "Description"
    QUANTITY = "Qty"
    UNIT = "Unit"
    RATE = "Rate"
    AMOUNT = "Amount"
    
    SUBTOTAL = "Subtotal"
    TAX = "Tax"
    DISCOUNT = "Discount"
    TOTAL = "Total"
    BALANCE_DUE = "Balance Due"
    AMOUNT_PAID = "Amount Paid"
    
    PAYMENT_TERMS = "Payment Terms"
    NOTES = "Notes"
    BANK_DETAILS = "Bank Details"
    THANK_YOU = "Thank you for your business!"
    
    PAGE = "Page"
    GENERATED = "Generated"


class InvoiceTextTamil:
    """Tamil text templates for invoices."""
    
    INVOICE = "விலைப்பட்டியல்"
    TAX_INVOICE = "வரி விலைப்பட்டியல்"
    
    BILL_FROM = "விற்பனையாளர்"
    BILL_TO = "கொள்முதலாளர்"
    
    INVOICE_NUMBER = "விலைப்பட்டியல் எண்"
    INVOICE_DATE = "தேதி"
    DUE_DATE = "கடைசி தேதி"
    
    DESCRIPTION = "விவரம்"
    QUANTITY = "அளவு"
    UNIT = "அலகு"
    RATE = "விகிதம்"
    AMOUNT = "தொகை"
    
    SUBTOTAL = "மொத்தம்"
    TAX = "வரி"
    DISCOUNT = "தள்ளுபடி"
    TOTAL = "இறுதி தொகை"
    BALANCE_DUE = "நிலுவை தொகை"
    AMOUNT_PAID = "செலுத்தப்பட்டது"
    
    PAYMENT_TERMS = "கட்டண விதிமுறைகள்"
    NOTES = "குறிப்புகள்"
    BANK_DETAILS = "வங்கி விவரங்கள்"
    THANK_YOU = "உங்கள் வணிகத்திற்கு நன்றி!"
    
    PAGE = "பக்கம்"
    GENERATED = "உருவாக்கப்பட்டது"


class InvoicePDFService:
    """Service for generating invoice PDFs with white-labeling support."""
    
    def __init__(self, language: str = "en"):
        """
        Initialize Invoice PDF service.
        
        Args:
            language: Language code ('en' or 'ta')
        """
        self.language = language
        self.template = get_template(language)
        self.font_manager = get_font_manager()
        self.colors = self.template.get_colors()
        self.layout = self.template.get_layout()
        self.typography = self.template.get_typography()
        self.table_style = self.template.get_table_style()
        self.text = InvoiceTextTamil() if language == "ta" else InvoiceText()
        
        self.styles = getSampleStyleSheet()
        self._init_styles()
    
    def _init_styles(self):
        """Initialize custom paragraph styles for invoice."""
        # Shop name style - large bold
        self.styles.add(ParagraphStyle(
            name='ShopName',
            parent=self.styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            textColor=self.colors.text_dark,
            spaceAfter=2,
            alignment=TA_LEFT
        ))
        
        # Owner name style
        self.styles.add(ParagraphStyle(
            name='OwnerName',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=self.colors.text_medium,
            spaceAfter=4,
            alignment=TA_LEFT
        ))
        
        # Address style
        self.styles.add(ParagraphStyle(
            name='Address',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=self.colors.text_medium,
            spaceAfter=2,
            leading=12,
            alignment=TA_LEFT
        ))
        
        # Invoice title style
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=self.styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=self.colors.primary,
            spaceAfter=4,
            alignment=TA_RIGHT
        ))
        
        # Invoice number style
        self.styles.add(ParagraphStyle(
            name='InvoiceNumber',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=self.colors.text_dark,
            spaceAfter=2,
            alignment=TA_RIGHT
        ))
        
        # Label style (for field labels)
        self.styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=self.colors.text_light,
            spaceAfter=2,
            alignment=TA_LEFT
        ))
        
        # Field value style
        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=self.colors.text_dark,
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=self.colors.text_dark,
            spaceAfter=6,
            spaceBefore=12
        ))
        
        # Total label style
        self.styles.add(ParagraphStyle(
            name='TotalLabel',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=self.colors.text_dark,
            alignment=TA_RIGHT
        ))
        
        # Total value style
        self.styles.add(ParagraphStyle(
            name='TotalValue',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=self.colors.primary,
            alignment=TA_RIGHT
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='InvoiceFooter',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=self.colors.text_light,
            alignment=TA_CENTER
        ))
        
        # Notes style
        self.styles.add(ParagraphStyle(
            name='NotesText',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=self.colors.text_medium,
            leading=12,
            alignment=TA_LEFT
        ))
    
    def _format_currency(self, amount: float) -> str:
        """Format currency with Rupee symbol."""
        return f"₹{amount:,.2f}"
    
    def _format_date(self, date_val: date) -> str:
        """Format date for display."""
        if isinstance(date_val, date):
            return date_val.strftime("%d-%m-%Y")
        return str(date_val)
    
    def _create_business_header(
        self,
        business: Dict[str, Any]
    ) -> List[Any]:
        """
        Create business header with white-labeling.
        
        Args:
            business: Business profile data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Create header table with 2 columns
        # Left: Business info, Right: Invoice title
        
        left_content = []
        
        # Shop name
        left_content.append(Paragraph(
            business.get('shop_name', 'Shop Name'),
            self.styles['ShopName']
        ))
        
        # Owner name
        if business.get('owner_name'):
            left_content.append(Paragraph(
                business.get('owner_name', ''),
                self.styles['OwnerName']
            ))
        
        # Address
        address_parts = [business.get('address_line1', '')]
        if business.get('address_line2'):
            address_parts.append(business.get('address_line2'))
        address_parts.append(
            f"{business.get('city', '')}, {business.get('state', '')} - {business.get('pincode', '')}"
        )
        left_content.append(Paragraph(
            "<br/>".join(address_parts),
            self.styles['Address']
        ))
        
        # Contact
        contact_parts = [f"Phone: {business.get('phone', '')}"]
        if business.get('email'):
            contact_parts.append(f"Email: {business.get('email')}")
        left_content.append(Paragraph(
            " | ".join(contact_parts),
            self.styles['Address']
        ))
        
        # GST/PAN if available
        if business.get('gst_number'):
            left_content.append(Paragraph(
                f"GST: {business.get('gst_number')}",
                self.styles['Address']
            ))
        
        # Right content - Invoice title
        right_content = []
        right_content.append(Paragraph(
            self.text.TAX_INVOICE if business.get('gst_number') else self.text.INVOICE,
            self.styles['InvoiceTitle']
        ))
        
        # Create header table
        header_data = [[left_content, right_content]]
        header_table = Table(header_data, colWidths=[4*inch, 3*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 0.3*cm))
        
        # Divider line
        elements.append(HRFlowable(
            width="100%",
            thickness=2,
            color=self.colors.primary,
            spaceBefore=2,
            spaceAfter=10
        ))
        
        return elements
    
    def _create_invoice_details(
        self,
        invoice: Dict[str, Any]
    ) -> List[Any]:
        """
        Create invoice details section (number, date, due date).
        
        Args:
            invoice: Invoice data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Create details table
        details_data = [
            [Paragraph(f"<b>{self.text.INVOICE_NUMBER}</b>", self.styles['FieldLabel']),
             Paragraph(invoice.get('invoice_number', ''), self.styles['FieldValue']),
             Paragraph(f"<b>{self.text.INVOICE_DATE}</b>", self.styles['FieldLabel']),
             Paragraph(self._format_date(invoice.get('invoice_date', date.today())), self.styles['FieldValue'])],
        ]
        
        if invoice.get('due_date'):
            details_data.append([
                Paragraph(f"<b>{self.text.DUE_DATE}</b>", self.styles['FieldLabel']),
                Paragraph(self._format_date(invoice.get('due_date')), self.styles['FieldValue']),
                "", ""
            ])
        
        details_table = Table(details_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        elements.append(details_table)
        elements.append(Spacer(1, 0.3*cm))
        
        return elements
    
    def _create_parties_section(
        self,
        business: Dict[str, Any],
        invoice: Dict[str, Any]
    ) -> List[Any]:
        """
        Create Bill From / Bill To section.
        
        Args:
            business: Business profile data
            invoice: Invoice data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Bill From
        bill_from_content = []
        bill_from_content.append(Paragraph(f"<b>{self.text.BILL_FROM}</b>", self.styles['SectionHeader']))
        bill_from_content.append(Paragraph(business.get('shop_name', ''), self.styles['FieldValue']))
        if business.get('owner_name'):
            bill_from_content.append(Paragraph(business.get('owner_name'), self.styles['NotesText']))
        bill_from_content.append(Paragraph(business.get('phone', ''), self.styles['NotesText']))
        
        # Bill To
        bill_to_content = []
        bill_to_content.append(Paragraph(f"<b>{self.text.BILL_TO}</b>", self.styles['SectionHeader']))
        bill_to_content.append(Paragraph(invoice.get('customer_name', ''), self.styles['FieldValue']))
        if invoice.get('customer_phone'):
            bill_to_content.append(Paragraph(invoice.get('customer_phone'), self.styles['NotesText']))
        if invoice.get('customer_address'):
            bill_to_content.append(Paragraph(invoice.get('customer_address'), self.styles['NotesText']))
        
        # Create parties table
        parties_data = [[bill_from_content, bill_to_content]]
        parties_table = Table(parties_data, colWidths=[3.5*inch, 3.5*inch])
        parties_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('BOX', (0, 0), (0, 0), 1, self.colors.border),
            ('BOX', (1, 0), (1, 0), 1, self.colors.border),
            ('BACKGROUND', (0, 0), (-1, -1), self.colors.alternate),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(parties_table)
        elements.append(Spacer(1, 0.4*cm))
        
        return elements
    
    def _create_items_table(
        self,
        items: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Create invoice items table.
        
        Args:
            items: List of invoice items
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Table headers
        headers = [
            "#",
            self.text.DESCRIPTION,
            self.text.QUANTITY,
            self.text.UNIT,
            self.text.RATE,
            self.text.AMOUNT
        ]
        
        # Column widths
        col_widths = [0.4*inch, 3.2*inch, 0.7*inch, 0.6*inch, 1*inch, 1.1*inch]
        
        # Build table data
        data = [headers]
        
        for idx, item in enumerate(items, 1):
            row = [
                str(idx),
                item.get('description', ''),
                f"{item.get('quantity', 0):.2f}",
                item.get('unit', 'kg'),
                self._format_currency(item.get('rate', 0)),
                self._format_currency(item.get('total', 0))
            ]
            data.append(row)
        
        # Create table
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Apply styles
        styles = [
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), self.table_style.header_bg_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.table_style.header_text_color),
            ('FONTNAME', (0, 0), (-1, 0), self.table_style.header_font),
            ('FONTSIZE', (0, 0), (-1, 0), self.table_style.header_font_size),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            
            # Body rows
            ('FONTNAME', (0, 1), (-1, -1), self.table_style.body_font),
            ('FONTSIZE', (0, 1), (-1, -1), self.table_style.body_font_size),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.text_dark),
            ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
            
            # Column alignments
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
            
            # Borders
            ('GRID', (0, 0), (-1, -1), self.table_style.border_width, self.table_style.border_color),
            ('LINEBELOW', (0, 0), (-1, 0), 2, self.colors.primary),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]
        
        # Alternate row colors
        for i in range(1, len(data)):
            if i % 2 == 0:
                styles.append(('BACKGROUND', (0, i), (-1, i), self.table_style.alternate_row_color))
        
        table.setStyle(TableStyle(styles))
        elements.append(table)
        elements.append(Spacer(1, 0.3*cm))
        
        return elements
    
    def _create_totals_section(
        self,
        invoice: Dict[str, Any]
    ) -> List[Any]:
        """
        Create invoice totals section.
        
        Args:
            invoice: Invoice data with totals
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Build totals data
        totals_data = []
        
        # Subtotal
        totals_data.append([
            Paragraph(self.text.SUBTOTAL, self.styles['FieldLabel']),
            Paragraph(self._format_currency(invoice.get('subtotal', 0)), self.styles['FieldValue'])
        ])
        
        # Tax (if applicable)
        if invoice.get('tax_rate', 0) > 0:
            totals_data.append([
                Paragraph(f"{self.text.TAX} ({invoice.get('tax_rate', 0)}%)", self.styles['FieldLabel']),
                Paragraph(self._format_currency(invoice.get('tax_amount', 0)), self.styles['FieldValue'])
            ])
        
        # Discount (if applicable)
        if invoice.get('discount', 0) > 0:
            totals_data.append([
                Paragraph(self.text.DISCOUNT, self.styles['FieldLabel']),
                Paragraph(f"- {self._format_currency(invoice.get('discount', 0))}", self.styles['FieldValue'])
            ])
        
        # Total
        totals_data.append([
            Paragraph(self.text.TOTAL, self.styles['TotalLabel']),
            Paragraph(self._format_currency(invoice.get('total_amount', 0)), self.styles['TotalValue'])
        ])
        
        # Amount paid (if applicable)
        if invoice.get('amount_paid', 0) > 0:
            totals_data.append([
                Paragraph(self.text.AMOUNT_PAID, self.styles['FieldLabel']),
                Paragraph(f"- {self._format_currency(invoice.get('amount_paid', 0))}", self.styles['FieldValue'])
            ])
            
            # Balance due
            totals_data.append([
                Paragraph(self.text.BALANCE_DUE, self.styles['TotalLabel']),
                Paragraph(self._format_currency(invoice.get('balance_due', 0)), self.styles['TotalValue'])
            ])
        
        # Create totals table
        totals_table = Table(totals_data, colWidths=[5*inch, 2*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            # Highlight total row(s)
            ('BACKGROUND', (0, -1), (-1, -1), self.colors.primary_light),
            ('LINEABOVE', (0, -1), (-1, -1), 1, self.colors.primary),
        ]))
        
        # If we have balance due, highlight that too
        if invoice.get('amount_paid', 0) > 0:
            total_idx = len(totals_data) - 2  # Total row index
            totals_table.setStyle(TableStyle([
                ('BACKGROUND', (0, total_idx), (-1, total_idx), self.colors.alternate),
            ]))
        
        # Right-align the table
        wrapper_table = Table([[totals_table]], colWidths=[7*inch])
        wrapper_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
        ]))
        
        elements.append(wrapper_table)
        elements.append(Spacer(1, 0.5*cm))
        
        return elements
    
    def _create_bank_details(
        self,
        business: Dict[str, Any]
    ) -> List[Any]:
        """
        Create bank details section if available.
        
        Args:
            business: Business profile with bank details
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Check if any bank details are available
        has_bank_details = any([
            business.get('bank_name'),
            business.get('bank_account_number'),
            business.get('bank_ifsc_code'),
            business.get('upi_id')
        ])
        
        if not has_bank_details:
            return elements
        
        elements.append(Paragraph(f"<b>{self.text.BANK_DETAILS}</b>", self.styles['SectionHeader']))
        
        bank_info = []
        if business.get('bank_name'):
            bank_info.append(f"Bank: {business.get('bank_name')}")
        if business.get('bank_account_number'):
            bank_info.append(f"A/C: {business.get('bank_account_number')}")
        if business.get('bank_ifsc_code'):
            bank_info.append(f"IFSC: {business.get('bank_ifsc_code')}")
        if business.get('bank_branch'):
            bank_info.append(f"Branch: {business.get('bank_branch')}")
        if business.get('upi_id'):
            bank_info.append(f"UPI: {business.get('upi_id')}")
        
        elements.append(Paragraph(" | ".join(bank_info), self.styles['NotesText']))
        elements.append(Spacer(1, 0.3*cm))
        
        return elements
    
    def _create_notes_section(
        self,
        business: Dict[str, Any],
        invoice: Dict[str, Any]
    ) -> List[Any]:
        """
        Create notes and terms section.
        
        Args:
            business: Business profile
            invoice: Invoice data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Notes
        notes = invoice.get('notes') or business.get('invoice_notes')
        if notes:
            elements.append(Paragraph(f"<b>{self.text.NOTES}</b>", self.styles['SectionHeader']))
            elements.append(Paragraph(notes, self.styles['NotesText']))
            elements.append(Spacer(1, 0.2*cm))
        
        # Terms
        terms = invoice.get('terms') or business.get('invoice_terms')
        if terms:
            elements.append(Paragraph(f"<b>{self.text.PAYMENT_TERMS}</b>", self.styles['SectionHeader']))
            elements.append(Paragraph(terms, self.styles['NotesText']))
            elements.append(Spacer(1, 0.2*cm))
        
        # Thank you message
        elements.append(Spacer(1, 0.3*cm))
        elements.append(Paragraph(
            f"<i>{self.text.THANK_YOU}</i>",
            ParagraphStyle(
                'ThankYou',
                parent=self.styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=10,
                textColor=self.colors.text_medium,
                alignment=TA_CENTER
            )
        ))
        
        return elements
    
    def generate_invoice_pdf(
        self,
        business: Dict[str, Any],
        invoice: Dict[str, Any],
        items: List[Dict[str, Any]]
    ) -> bytes:
        """
        Generate invoice PDF with white-labeling.
        
        Args:
            business: Business profile data
            invoice: Invoice data
            items: List of invoice items
            
        Returns:
            PDF bytes
        """
        buffer = io.BytesIO()
        
        # Create document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.75*inch,
            rightMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
            title=f"Invoice {invoice.get('invoice_number', '')}",
            author=business.get('shop_name', 'Malar Market'),
            subject="Invoice"
        )
        
        elements = []
        
        # Build invoice sections
        elements.extend(self._create_business_header(business))
        elements.extend(self._create_invoice_details(invoice))
        elements.extend(self._create_parties_section(business, invoice))
        elements.extend(self._create_items_table(items))
        elements.extend(self._create_totals_section(invoice))
        elements.extend(self._create_bank_details(business))
        elements.extend(self._create_notes_section(business, invoice))
        
        # Build PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        logger.info(f"Generated invoice PDF: {invoice.get('invoice_number')}")
        
        return pdf_bytes


def get_invoice_service(language: str = "en") -> InvoicePDFService:
    """
    Get invoice PDF service instance.
    
    Args:
        language: Language code ('en' or 'ta')
        
    Returns:
        InvoicePDFService instance
    """
    return InvoicePDFService(language)
