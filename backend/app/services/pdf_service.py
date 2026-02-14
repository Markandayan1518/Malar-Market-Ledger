"""PDF generation service for Malar Market Digital Ledger."""

import io
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    PageBreak, KeepTogether, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.services.font_manager import get_font_manager
from app.services.report_templates import (
    get_template, ReportTemplates, ColorScheme, PDFLayout,
    PDFTypography, PDFTableStyle
)

logger = logging.getLogger(__name__)


class PDFService:
    """Service for generating PDF reports with Tamil font support."""
    
    def __init__(self, language: str = "en"):
        """
        Initialize PDF service.
        
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
        self.text = self.template.get_text()
        
        # Initialize styles
        self.styles = getSampleStyleSheet()
        self._init_styles()
    
    def _init_styles(self):
        """Initialize custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontName=self.typography.title_font,
            fontSize=self.typography.title_size,
            textColor=self.colors.text_dark,
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontName=self.typography.subtitle_font,
            fontSize=self.typography.subtitle_size,
            textColor=self.colors.text_dark,
            spaceAfter=10,
            alignment=TA_CENTER
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading3'],
            fontName=self.typography.header_font,
            fontSize=self.typography.header_size,
            textColor=self.colors.primary,
            spaceAfter=8,
            spaceBefore=12
        ))
        
        # Body style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontName=self.typography.body_font,
            fontSize=self.typography.body_size,
            textColor=self.colors.text_dark,
            spaceAfter=6,
            leading=14
        ))
        
        # Small style
        self.styles.add(ParagraphStyle(
            name='CustomSmall',
            parent=self.styles['Normal'],
            fontName=self.typography.small_font,
            fontSize=self.typography.small_size,
            textColor=self.colors.text_medium,
            spaceAfter=4,
            leading=10
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='CustomFooter',
            parent=self.styles['Normal'],
            fontName=self.typography.footer_font,
            fontSize=self.typography.footer_size,
            textColor=self.colors.text_light,
            alignment=TA_CENTER
        ))
    
    def _get_font_for_text(self, text: str, bold: bool = False) -> str:
        """
        Get appropriate font for text.
        
        Args:
            text: Text to render
            bold: Whether to use bold font
            
        Returns:
            Font name
        """
        if bold:
            return self.font_manager.get_bold_font_for_text(text)
        return self.font_manager.get_font_for_text(text)
    
    def _create_pdf_document(
        self,
        title: str,
        elements: List[Any],
        filename: Optional[str] = None
    ) -> bytes:
        """
        Create PDF document from elements.
        
        Args:
            title: Document title
            elements: List of PDF elements
            filename: Optional filename for metadata
            
        Returns:
            PDF bytes
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=self.layout.margin_left,
            rightMargin=self.layout.margin_right,
            topMargin=self.layout.margin_top,
            bottomMargin=self.layout.margin_bottom,
            title=title,
            author="Malar Market Digital Ledger",
            subject=title,
            creator="Malar Market Digital Ledger"
        )
        
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _create_header(self, title: str, subtitle: Optional[str] = None) -> List[Any]:
        """
        Create document header.
        
        Args:
            title: Main title
            subtitle: Optional subtitle
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Title
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        
        # Subtitle
        if subtitle:
            elements.append(Paragraph(subtitle, self.styles['CustomSubtitle']))
        
        # Divider line
        elements.append(Spacer(1, 0.2 * cm))
        
        return elements
    
    def _create_farmer_details_section(
        self,
        farmer_data: Dict[str, Any]
    ) -> List[Any]:
        """
        Create farmer details section.
        
        Args:
            farmer_data: Farmer information
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        elements.append(Paragraph(self.text.FARMER_NAME, self.styles['CustomHeader']))
        
        # Create table for farmer details
        details = [
            [self.text.FARMER_NAME, farmer_data.get('name', '')],
            [self.text.FARMER_ID, farmer_data.get('farmer_code', '')],
            [self.text.VILLAGE, farmer_data.get('village', '')],
            [self.text.PHONE, farmer_data.get('phone', '')]
        ]
        
        table = Table(details, colWidths=[2 * inch, 4 * inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), self.typography.header_font),
            ('FONTNAME', (1, 0), (1, -1), self.typography.body_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.colors.text_medium),
            ('TEXTCOLOR', (1, 0), (1, -1), self.colors.text_dark),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3 * cm))
        
        return elements
    
    def _create_summary_table(
        self,
        summary_data: Dict[str, Any]
    ) -> List[Any]:
        """
        Create summary table.
        
        Args:
            summary_data: Summary information
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        elements.append(Paragraph(self.text.SUMMARY, self.styles['CustomHeader']))
        
        # Create summary table
        data = [
            [self.text.TOTAL_WEIGHT, self.template.format_weight(summary_data.get('total_quantity', 0))],
            [self.text.GROSS_VALUE, self.template.format_currency(summary_data.get('gross_amount', 0))],
            [self.text.COMMISSION, self.template.format_currency(summary_data.get('total_commission', 0))],
            [self.text.FEES, self.template.format_currency(summary_data.get('total_fees', 0))],
            [self.text.ADVANCES, self.template.format_currency(summary_data.get('total_advances', 0))],
            [self.text.NET_AMOUNT, self.template.format_currency(summary_data.get('net_payable', 0))]
        ]
        
        table = Table(data, colWidths=[2.5 * inch, 3.5 * inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), self.typography.header_font),
            ('FONTNAME', (1, 0), (1, -1), self.typography.body_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.colors.text_medium),
            ('TEXTCOLOR', (1, 0), (1, -1), self.colors.text_dark),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.colors.border),
            ('BACKGROUND', (0, 0), (0, -1), self.colors.alternate),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        # Highlight net amount row
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, -1), (-1, -1), self.colors.primary_light),
            ('FONTNAME', (0, -1), (-1, -1), self.typography.header_font),
            ('TEXTCOLOR', (0, -1), (-1, -1), self.colors.primary),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3 * cm))
        
        return elements
    
    def _create_daily_entries_table(
        self,
        entries: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Create daily entries table.
        
        Args:
            entries: List of daily entry data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        elements.append(Paragraph(self.text.DAILY_ENTRIES, self.styles['CustomHeader']))
        
        if not entries:
            elements.append(Paragraph("No entries found.", self.styles['CustomBody']))
            elements.append(Spacer(1, 0.3 * cm))
            return elements
        
        # Create table header
        headers = [
            self.text.DATE,
            self.text.FLOWER_TYPE,
            self.text.WEIGHT,
            self.text.RATE,
            self.text.TOTAL
        ]
        
        # Create table data
        data = [headers]
        
        for entry in entries:
            row = [
                entry.get('entry_date', ''),
                entry.get('flower_name', ''),
                self.template.format_weight(entry.get('quantity', 0)),
                self.template.format_currency(entry.get('rate_per_unit', 0)),
                self.template.format_currency(entry.get('total_amount', 0))
            ]
            data.append(row)
        
        # Calculate column widths
        col_widths = [1.2 * inch, 2 * inch, 1.2 * inch, 1.2 * inch, 1.4 * inch]
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Apply table styles
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
            
            # Alignment
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
            
            # Borders
            ('GRID', (0, 0), (-1, -1), self.table_style.border_width, self.table_style.border_color),
            ('LINEBELOW', (0, 0), (-1, 0), 2, self.colors.primary),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('BOTTOMPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('LEFTPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('RIGHTPADDING', (0, 0), (-1, -1), self.table_style.padding),
        ]
        
        # Alternate row colors
        for i in range(1, len(data)):
            if i % 2 == 0:
                styles.append(('BACKGROUND', (0, i), (-1, i), self.table_style.alternate_row_color))
        
        table.setStyle(TableStyle(styles))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3 * cm))
        
        return elements
    
    def _create_cash_advances_table(
        self,
        advances: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Create cash advances table.
        
        Args:
            advances: List of cash advance data
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        elements.append(Paragraph(self.text.CASH_ADVANCES, self.styles['CustomHeader']))
        
        if not advances:
            elements.append(Paragraph("No advances found.", self.styles['CustomBody']))
            elements.append(Spacer(1, 0.3 * cm))
            return elements
        
        # Create table header
        headers = [
            self.text.DATE,
            self.text.AMOUNT,
            self.text.REASON,
            self.text.STATUS
        ]
        
        # Create table data
        data = [headers]
        
        for advance in advances:
            status = self.template.get_status_text(advance.get('status', 'pending'))
            row = [
                advance.get('advance_date', ''),
                self.template.format_currency(advance.get('amount', 0)),
                advance.get('reason', ''),
                status
            ]
            data.append(row)
        
        # Calculate column widths
        col_widths = [1.2 * inch, 1.5 * inch, 2.5 * inch, 1.8 * inch]
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Apply table styles
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
            
            # Alignment
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 1), (2, -1), 'LEFT'),
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            
            # Borders
            ('GRID', (0, 0), (-1, -1), self.table_style.border_width, self.table_style.border_color),
            ('LINEBELOW', (0, 0), (-1, 0), 2, self.colors.primary),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('BOTTOMPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('LEFTPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ('RIGHTPADDING', (0, 0), (-1, -1), self.table_style.padding),
        ]
        
        # Alternate row colors
        for i in range(1, len(data)):
            if i % 2 == 0:
                styles.append(('BACKGROUND', (0, i), (-1, i), self.table_style.alternate_row_color))
        
        table.setStyle(TableStyle(styles))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3 * cm))
        
        return elements
    
    def _create_payment_details_section(
        self,
        payment_data: Dict[str, Any]
    ) -> List[Any]:
        """
        Create payment details section.
        
        Args:
            payment_data: Payment information
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        elements.append(Paragraph(self.text.PAYMENT_DETAILS, self.styles['CustomHeader']))
        
        # Create table for payment details
        details = [
            [self.text.PAYMENT_DATE, payment_data.get('payment_date', '')],
            [self.text.PAYMENT_METHOD, payment_data.get('payment_method', '')],
            [self.text.REFERENCE, payment_data.get('reference', '')]
        ]
        
        table = Table(details, colWidths=[2 * inch, 4 * inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), self.typography.header_font),
            ('FONTNAME', (1, 0), (1, -1), self.typography.body_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.colors.text_medium),
            ('TEXTCOLOR', (1, 0), (1, -1), self.colors.text_dark),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3 * cm))
        
        return elements
    
    def _create_footer(self, page_num: int, total_pages: int) -> List[Any]:
        """
        Create document footer.
        
        Args:
            page_num: Current page number
            total_pages: Total number of pages
            
        Returns:
            List of PDF elements
        """
        elements = []
        
        # Page number
        page_text = f"{self.text.PAGE} {page_num} / {total_pages}"
        elements.append(Paragraph(page_text, self.styles['CustomFooter']))
        
        # Generated timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        generated_text = f"{self.text.GENERATED}: {timestamp}"
        elements.append(Paragraph(generated_text, self.styles['CustomFooter']))
        
        # Confidential notice
        elements.append(Paragraph(self.text.CONFIDENTIAL, self.styles['CustomFooter']))
        
        return elements
    
    def generate_farmer_statement(
        self,
        farmer_data: Dict[str, Any],
        summary_data: Dict[str, Any],
        entries: List[Dict[str, Any]],
        advances: List[Dict[str, Any]],
        payment_data: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Generate farmer monthly statement PDF.
        
        Args:
            farmer_data: Farmer information
            summary_data: Summary statistics
            entries: List of daily entries
            advances: List of cash advances
            payment_data: Optional payment information
            
        Returns:
            PDF bytes
        """
        elements = []
        
        # Create title
        month_name = self.template.get_month_name(summary_data.get('month', 1))
        year = summary_data.get('year', datetime.now().year)
        title = f"{self.text.FARMER_STATEMENT} - {month_name} {year}"
        
        # Create header
        elements.extend(self._create_header(title))
        
        # Create farmer details section
        elements.extend(self._create_farmer_details_section(farmer_data))
        
        # Create summary table
        elements.extend(self._create_summary_table(summary_data))
        
        # Create daily entries table
        elements.extend(self._create_daily_entries_table(entries))
        
        # Create cash advances table
        elements.extend(self._create_cash_advances_table(advances))
        
        # Create payment details if available
        if payment_data:
            elements.extend(self._create_payment_details_section(payment_data))
        
        # Create PDF
        pdf_bytes = self._create_pdf_document(title, elements)
        
        logger.info(f"Generated farmer statement PDF for farmer {farmer_data.get('id')}")
        
        return pdf_bytes
    
    def generate_monthly_report(
        self,
        report_data: Dict[str, Any],
        farmer_summaries: List[Dict[str, Any]],
        daily_entries: List[Dict[str, Any]]
    ) -> bytes:
        """
        Generate master monthly report PDF.
        
        Args:
            report_data: Report metadata
            farmer_summaries: List of farmer summaries
            daily_entries: List of all daily entries
            
        Returns:
            PDF bytes
        """
        elements = []
        
        # Create title
        month_name = self.template.get_month_name(report_data.get('month', 1))
        year = report_data.get('year', datetime.now().year)
        title = f"{self.text.MONTHLY_REPORT} - {month_name} {year}"
        
        # Create header
        elements.extend(self._create_header(title))
        
        # Create report summary section
        elements.append(Paragraph(self.text.SUMMARY, self.styles['CustomHeader']))
        
        summary_table_data = [
            ["Total Farmers", str(len(farmer_summaries))],
            ["Total Entries", str(len(daily_entries))],
            ["Total Weight", self.template.format_weight(report_data.get('total_weight', 0))],
            ["Total Gross Value", self.template.format_currency(report_data.get('total_gross', 0))],
            ["Total Net Amount", self.template.format_currency(report_data.get('total_net', 0))]
        ]
        
        summary_table = Table(summary_table_data, colWidths=[2.5 * inch, 3.5 * inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), self.typography.header_font),
            ('FONTNAME', (1, 0), (1, -1), self.typography.body_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.colors.text_medium),
            ('TEXTCOLOR', (1, 0), (1, -1), self.colors.text_dark),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.colors.border),
            ('BACKGROUND', (0, 0), (0, -1), self.colors.alternate),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3 * cm))
        
        # Create farmer summaries table
        elements.append(Paragraph("Farmer Summaries", self.styles['CustomHeader']))
        
        if farmer_summaries:
            headers = ["Farmer ID", "Name", "Entries", "Weight", "Net Amount"]
            data = [headers]
            
            for summary in farmer_summaries[:50]:  # Limit to 50 farmers for PDF
                row = [
                    summary.get('farmer_code', ''),
                    summary.get('name', ''),
                    str(summary.get('total_entries', 0)),
                    self.template.format_weight(summary.get('total_quantity', 0)),
                    self.template.format_currency(summary.get('net_amount', 0))
                ]
                data.append(row)
            
            col_widths = [1.2 * inch, 2 * inch, 0.8 * inch, 1.2 * inch, 1.8 * inch]
            table = Table(data, colWidths=col_widths, repeatRows=1)
            
            styles = [
                ('BACKGROUND', (0, 0), (-1, 0), self.table_style.header_bg_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.table_style.header_text_color),
                ('FONTNAME', (0, 0), (-1, 0), self.table_style.header_font),
                ('FONTSIZE', (0, 0), (-1, 0), self.table_style.header_font_size),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('FONTNAME', (0, 1), (-1, -1), self.table_style.body_font),
                ('FONTSIZE', (0, 1), (-1, -1), self.table_style.body_font_size),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.text_dark),
                ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), self.table_style.border_width, self.table_style.border_color),
                ('LINEBELOW', (0, 0), (-1, 0), 2, self.colors.primary),
                ('TOPPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('BOTTOMPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('LEFTPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('RIGHTPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ]
            
            for i in range(1, len(data)):
                if i % 2 == 0:
                    styles.append(('BACKGROUND', (0, i), (-1, i), self.table_style.alternate_row_color))
            
            table.setStyle(TableStyle(styles))
            elements.append(table)
        
        # Create PDF
        pdf_bytes = self._create_pdf_document(title, elements)
        
        logger.info(f"Generated monthly report PDF for {month_name} {year}")
        
        return pdf_bytes
    
    def generate_daily_summary(
        self,
        date: date,
        summary_data: Dict[str, Any],
        entries: List[Dict[str, Any]]
    ) -> bytes:
        """
        Generate daily summary PDF.
        
        Args:
            date: Report date
            summary_data: Summary statistics
            entries: List of daily entries
            
        Returns:
            PDF bytes
        """
        elements = []
        
        # Create title
        date_str = date.strftime("%d-%m-%Y")
        title = f"{self.text.DAILY_SUMMARY} - {date_str}"
        
        # Create header
        elements.extend(self._create_header(title))
        
        # Create summary section
        elements.extend(self._create_summary_table(summary_data))
        
        # Create entries table
        elements.extend(self._create_daily_entries_table(entries))
        
        # Create PDF
        pdf_bytes = self._create_pdf_document(title, elements)
        
        logger.info(f"Generated daily summary PDF for {date_str}")
        
        return pdf_bytes
    
    def generate_settlement_report(
        self,
        settlement_data: Dict[str, Any],
        items: List[Dict[str, Any]]
    ) -> bytes:
        """
        Generate settlement report PDF.
        
        Args:
            settlement_data: Settlement information
            items: List of settlement items
            
        Returns:
            PDF bytes
        """
        elements = []
        
        # Create title
        settlement_number = settlement_data.get('settlement_number', '')
        title = f"{self.text.SETTLEMENT_REPORT} - {settlement_number}"
        
        # Create header
        elements.extend(self._create_header(title))
        
        # Create farmer details
        farmer_data = {
            'name': settlement_data.get('farmer_name', ''),
            'farmer_code': settlement_data.get('farmer_code', ''),
            'village': settlement_data.get('village', ''),
            'phone': settlement_data.get('phone', '')
        }
        elements.extend(self._create_farmer_details_section(farmer_data))
        
        # Create settlement summary
        summary_data = {
            'total_quantity': settlement_data.get('total_quantity', 0),
            'gross_amount': settlement_data.get('gross_amount', 0),
            'total_commission': settlement_data.get('total_commission', 0),
            'total_fees': settlement_data.get('total_fees', 0),
            'total_advances': settlement_data.get('total_advances', 0),
            'net_payable': settlement_data.get('net_payable', 0)
        }
        elements.extend(self._create_summary_table(summary_data))
        
        # Create settlement items table
        elements.append(Paragraph("Settlement Items", self.styles['CustomHeader']))
        
        if items:
            headers = [
                self.text.DATE,
                self.text.FLOWER_TYPE,
                self.text.WEIGHT,
                self.text.RATE,
                self.text.TOTAL
            ]
            
            data = [headers]
            
            for item in items:
                row = [
                    item.get('entry_date', ''),
                    item.get('flower_type', ''),
                    self.template.format_weight(item.get('quantity', 0)),
                    self.template.format_currency(item.get('rate_per_unit', 0)),
                    self.template.format_currency(item.get('net_amount', 0))
                ]
                data.append(row)
            
            col_widths = [1.2 * inch, 2 * inch, 1.2 * inch, 1.2 * inch, 1.4 * inch]
            table = Table(data, colWidths=col_widths, repeatRows=1)
            
            styles = [
                ('BACKGROUND', (0, 0), (-1, 0), self.table_style.header_bg_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.table_style.header_text_color),
                ('FONTNAME', (0, 0), (-1, 0), self.table_style.header_font),
                ('FONTSIZE', (0, 0), (-1, 0), self.table_style.header_font_size),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('FONTNAME', (0, 1), (-1, -1), self.table_style.body_font),
                ('FONTSIZE', (0, 1), (-1, -1), self.table_style.body_font_size),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.text_dark),
                ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), self.table_style.border_width, self.table_style.border_color),
                ('LINEBELOW', (0, 0), (-1, 0), 2, self.colors.primary),
                ('TOPPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('BOTTOMPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('LEFTPADDING', (0, 0), (-1, -1), self.table_style.padding),
                ('RIGHTPADDING', (0, 0), (-1, -1), self.table_style.padding),
            ]
            
            for i in range(1, len(data)):
                if i % 2 == 0:
                    styles.append(('BACKGROUND', (0, i), (-1, i), self.table_style.alternate_row_color))
            
            table.setStyle(TableStyle(styles))
            elements.append(table)
        
        # Create PDF
        pdf_bytes = self._create_pdf_document(title, elements)
        
        logger.info(f"Generated settlement report PDF for {settlement_number}")
        
        return pdf_bytes
