"""Report templates and styling constants for PDF and Excel generation."""

from dataclasses import dataclass
from typing import Dict, List, Optional
from reportlab.lib import colors
from reportlab.lib.units import inch, cm


@dataclass
class ColorScheme:
    """Color scheme for reports matching the app theme."""
    primary: colors.Color = colors.HexColor("#E91E63")  # Magenta
    primary_light: colors.Color = colors.HexColor("#FCE4EC")
    secondary: colors.Color = colors.HexColor("#9C27B0")  # Purple
    secondary_light: colors.Color = colors.HexColor("#F3E5F5")
    success: colors.Color = colors.HexColor("#10B981")  # Emerald
    success_light: colors.Color = colors.HexColor("#D1FAE5")
    warning: colors.Color = colors.HexColor("#F59E0B")  # Amber
    warning_light: colors.Color = colors.HexColor("#FEF3C7")
    danger: colors.Color = colors.HexColor("#DC2626")  # Crimson
    danger_light: colors.Color = colors.HexColor("#FEE2E2")
    text_dark: colors.Color = colors.HexColor("#1F2937")
    text_medium: colors.Color = colors.HexColor("#6B7280")
    text_light: colors.Color = colors.HexColor("#9CA3AF")
    border: colors.Color = colors.HexColor("#E5E7EB")
    background: colors.Color = colors.white
    alternate: colors.Color = colors.HexColor("#F9FAFB")
    header_bg: colors.Color = colors.HexColor("#374151")
    header_text: colors.Color = colors.white


@dataclass
class PDFLayout:
    """PDF layout configuration."""
    page_width: float = 8.5 * inch  # A4 width
    page_height: float = 11 * inch  # A4 height
    margin_left: float = 1 * inch
    margin_right: float = 1 * inch
    margin_top: float = 1 * inch
    margin_bottom: float = 1 * inch
    
    @property
    def content_width(self) -> float:
        """Available width for content."""
        return self.page_width - self.margin_left - self.margin_right
    
    @property
    def content_height(self) -> float:
        """Available height for content."""
        return self.page_height - self.margin_top - self.margin_bottom


@dataclass
class PDFTypography:
    """Typography settings for PDF."""
    title_font: str = "Helvetica-Bold"
    title_size: int = 18
    
    subtitle_font: str = "Helvetica-Bold"
    subtitle_size: int = 14
    
    header_font: str = "Helvetica-Bold"
    header_size: int = 12
    
    body_font: str = "Helvetica"
    body_size: int = 10
    
    small_font: str = "Helvetica"
    small_size: int = 8
    
    footer_font: str = "Helvetica"
    footer_size: int = 8


@dataclass
class PDFTableStyle:
    """Table styling for PDF."""
    header_bg_color: colors.Color = colors.HexColor("#374151")
    header_text_color: colors.Color = colors.white
    header_font: str = "Helvetica-Bold"
    header_font_size: int = 10
    
    body_font: str = "Helvetica"
    body_font_size: int = 9
    
    alternate_row_color: colors.Color = colors.HexColor("#F9FAFB")
    
    border_color: colors.Color = colors.HexColor("#E5E7EB")
    border_width: int = 1
    
    row_height: float = 20
    header_height: float = 25
    padding: float = 6


@dataclass
class ExcelStyle:
    """Excel styling constants."""
    header_fill: str = "374151"  # Dark gray
    header_font_color: str = "FFFFFF"
    header_font_size: int = 11
    header_font_bold: bool = True
    
    body_font_size: int = 10
    body_font_color: str = "1F2937"
    
    alternate_fill: str = "F9FAFB"
    border_color: str = "E5E7EB"
    
    number_format: str = "#,##0.00"
    currency_format: str = "₹#,##0.00"
    date_format: str = "DD-MM-YYYY"
    time_format: str = "HH:MM"
    
    row_height: float = 18
    header_row_height: float = 25


class TamilText:
    """Tamil text templates for reports."""
    
    # Common labels
    FARMER_STATEMENT = "விவசாயி கணக்கு"
    MONTHLY_REPORT = "மாதாந்திர அறிக்கை"
    DAILY_SUMMARY = "தினசரி சுருக்கம்"
    SETTLEMENT_REPORT = "தீர்வு அறிக்கை"
    
    # Farmer details
    FARMER_NAME = "விவசாயி பெயர்"
    FARMER_ID = "விவசாயி ஐடி"
    VILLAGE = "கிராமம்"
    PHONE = "தொலைபேசி"
    
    # Period
    PERIOD = "காலம்"
    FROM_DATE = "தேதி முதல்"
    TO_DATE = "தேதி வரை"
    
    # Summary
    SUMMARY = "சுருக்கம்"
    TOTAL_WEIGHT = "மொத்த எடை"
    GROSS_VALUE = "மொத்த மதிப்பு"
    COMMISSION = "கமிஷன்"
    FEES = "கட்டணங்கள்"
    ADVANCES = "முன்பணம்"
    NET_AMOUNT = "நிகர தொகை"
    
    # Daily entries
    DAILY_ENTRIES = "தினசரி பதிவுகள்"
    DATE = "தேதி"
    FLOWER_TYPE = "மலர் வகை"
    WEIGHT = "எடை"
    RATE = "விகிதம்"
    TOTAL = "மொத்தம்"
    ADJUSTMENTS = "சரிசெய்தல்கள்"
    
    # Cash advances
    CASH_ADVANCES = "ரொக்க முன்பணம்"
    AMOUNT = "தொகை"
    REASON = "காரணம்"
    STATUS = "நிலை"
    APPROVED = "ஒப்புதல் அளிக்கப்பட்டது"
    PENDING = "நிலுவையில்"
    REJECTED = "நிராகரிக்கப்பட்டது"
    
    # Payment
    PAYMENT_DETAILS = "கட்டண விவரங்கள்"
    PAYMENT_DATE = "கட்டண தேதி"
    PAYMENT_METHOD = "கட்டண முறை"
    REFERENCE = "குறிப்பு"
    
    # Footer
    PAGE = "பக்கம்"
    GENERATED = "உருவாக்கப்பட்டது"
    CONFIDENTIAL = "ரகசியம்"


class EnglishText:
    """English text templates for reports."""
    
    # Common labels
    FARMER_STATEMENT = "Farmer Statement"
    MONTHLY_REPORT = "Monthly Report"
    DAILY_SUMMARY = "Daily Summary"
    SETTLEMENT_REPORT = "Settlement Report"
    
    # Farmer details
    FARMER_NAME = "Farmer Name"
    FARMER_ID = "Farmer ID"
    VILLAGE = "Village"
    PHONE = "Phone"
    
    # Period
    PERIOD = "Period"
    FROM_DATE = "From Date"
    TO_DATE = "To Date"
    
    # Summary
    SUMMARY = "Summary"
    TOTAL_WEIGHT = "Total Weight"
    GROSS_VALUE = "Gross Value"
    COMMISSION = "Commission"
    FEES = "Fees"
    ADVANCES = "Advances"
    NET_AMOUNT = "Net Amount"
    
    # Daily entries
    DAILY_ENTRIES = "Daily Entries"
    DATE = "Date"
    FLOWER_TYPE = "Flower Type"
    WEIGHT = "Weight"
    RATE = "Rate"
    TOTAL = "Total"
    ADJUSTMENTS = "Adjustments"
    
    # Cash advances
    CASH_ADVANCES = "Cash Advances"
    AMOUNT = "Amount"
    REASON = "Reason"
    STATUS = "Status"
    APPROVED = "Approved"
    PENDING = "Pending"
    REJECTED = "Rejected"
    
    # Payment
    PAYMENT_DETAILS = "Payment Details"
    PAYMENT_DATE = "Payment Date"
    PAYMENT_METHOD = "Payment Method"
    REFERENCE = "Reference"
    
    # Footer
    PAGE = "Page"
    GENERATED = "Generated"
    CONFIDENTIAL = "Confidential"


class ReportTemplates:
    """Report templates for different report types."""
    
    def __init__(self, language: str = "en"):
        """
        Initialize report templates.
        
        Args:
            language: Language code ('en' or 'ta')
        """
        self.language = language
        self.text = TamilText() if language == "ta" else EnglishText()
        self.colors = ColorScheme()
        self.layout = PDFLayout()
        self.typography = PDFTypography()
        self.table_style = PDFTableStyle()
        self.excel_style = ExcelStyle()
    
    def get_text(self) -> EnglishText:
        """Get text template based on language."""
        return self.text
    
    def get_colors(self) -> ColorScheme:
        """Get color scheme."""
        return self.colors
    
    def get_layout(self) -> PDFLayout:
        """Get PDF layout configuration."""
        return self.layout
    
    def get_typography(self) -> PDFTypography:
        """Get typography settings."""
        return self.typography
    
    def get_table_style(self) -> PDFTableStyle:
        """Get table style."""
        return self.table_style
    
    def get_excel_style(self) -> ExcelStyle:
        """Get Excel style."""
        return self.excel_style
    
    def get_month_name(self, month: int) -> str:
        """
        Get month name in the configured language.
        
        Args:
            month: Month number (1-12)
            
        Returns:
            Month name in the configured language
        """
        english_months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        tamil_months = [
            "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
            "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
        ]
        
        if self.language == "ta":
            return tamil_months[month - 1]
        return english_months[month - 1]
    
    def get_status_text(self, status: str) -> str:
        """
        Get status text in the configured language.
        
        Args:
            status: Status value
            
        Returns:
            Status text in the configured language
        """
        status_map = {
            "en": {
                "approved": "Approved",
                "pending": "Pending",
                "rejected": "Rejected",
                "paid": "Paid",
                "unpaid": "Unpaid"
            },
            "ta": {
                "approved": "ஒப்புதல் அளிக்கப்பட்டது",
                "pending": "நிலுவையில்",
                "rejected": "நிராகரிக்கப்பட்டது",
                "paid": "செலுத்தப்பட்டது",
                "unpaid": "செலுத்தப்படவில்லை"
            }
        }
        
        return status_map.get(self.language, status_map["en"]).get(
            status.lower(), status
        )
    
    def format_currency(self, amount: float) -> str:
        """
        Format currency with Indian Rupee symbol.
        
        Args:
            amount: Amount to format
            
        Returns:
            Formatted currency string
        """
        return f"₹{amount:,.2f}"
    
    def format_weight(self, weight: float) -> str:
        """
        Format weight with appropriate unit.
        
        Args:
            weight: Weight value
            
        Returns:
            Formatted weight string
        """
        return f"{weight:,.2f} kg"


# Global template instances
_templates_cache: Dict[str, ReportTemplates] = {}


def get_template(language: str = "en") -> ReportTemplates:
    """
    Get or create a report template instance.
    
    Args:
        language: Language code ('en' or 'ta')
        
    Returns:
        ReportTemplates instance
    """
    if language not in _templates_cache:
        _templates_cache[language] = ReportTemplates(language)
    return _templates_cache[language]
