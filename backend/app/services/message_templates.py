"""Message templates for WhatsApp notifications with bilingual support (English & Tamil)."""

from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum


class Language(str, Enum):
    """Supported languages for WhatsApp messages."""
    ENGLISH = "en"
    TAMIL = "ta"


class MessageType(str, Enum):
    """Types of WhatsApp messages."""
    ENTRY_RECEIPT = "receipt"
    DAILY_SUMMARY = "daily_summary"
    MONTHLY_SUMMARY = "monthly_summary"
    ADVANCE_STATUS = "advance_status"
    SETTLEMENT_NOTIFICATION = "settlement"
    BOT_RESPONSE = "bot_response"
    HELP_MESSAGE = "help"
    ERROR_MESSAGE = "error"


class MessageTemplates:
    """Bilingual message templates for WhatsApp notifications."""
    
    # Indian number formatting
    @staticmethod
    def format_currency(amount: float) -> str:
        """Format amount in Indian currency format (₹)."""
        return f"₹{amount:,.2f}"
    
    @staticmethod
    def format_date(date: datetime) -> str:
        """Format date in Indian format (DD-MM-YYYY)."""
        return date.strftime("%d-%m-%Y")
    
    @staticmethod
    def format_date_ta(date: datetime) -> str:
        """Format date in Tamil format."""
        return date.strftime("%d-%m-%Y")
    
    # Entry Receipt Templates
    @staticmethod
    def entry_receipt_en(
        farmer_name: str,
        date: datetime,
        flower_type: str,
        quantity: float,
        rate: float,
        total_amount: float,
        net_amount: float
    ) -> str:
        """Entry receipt template in English."""
        return (
            f"📋 *Entry Receipt*\n\n"
            f"👤 Farmer: {farmer_name}\n"
            f"📅 Date: {MessageTemplates.format_date(date)}\n"
            f"🌸 Flower: {flower_type}\n"
            f"⚖️ Weight: {quantity:.2f} kg\n"
            f"💰 Rate: {MessageTemplates.format_currency(rate)}/kg\n"
            f"💵 Total: {MessageTemplates.format_currency(total_amount)}\n"
            f"✅ Net: {MessageTemplates.format_currency(net_amount)}\n\n"
            f"_Thank you for your business!_"
        )
    
    @staticmethod
    def entry_receipt_ta(
        farmer_name: str,
        date: datetime,
        flower_type: str,
        quantity: float,
        rate: float,
        total_amount: float,
        net_amount: float
    ) -> str:
        """Entry receipt template in Tamil."""
        return (
            f"📋 *பதிவு ரசீது*\n\n"
            f"👤 விவசாயி: {farmer_name}\n"
            f"📅 தேதி: {MessageTemplates.format_date_ta(date)}\n"
            f"🌸 பூ: {flower_type}\n"
            f"⚖️ எடை: {quantity:.2f} கிலோ\n"
            f"💰 விலை: {MessageTemplates.format_currency(rate)}/கிலோ\n"
            f"💵 மொத்தம்: {MessageTemplates.format_currency(total_amount)}\n"
            f"✅ நிகரம்: {MessageTemplates.format_currency(net_amount)}\n\n"
            f"_உங்கள் வணிகத்திற்கு நன்றி!_"
        )
    
    @staticmethod
    def get_entry_receipt(
        language: Language,
        **kwargs
    ) -> str:
        """Get entry receipt in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.entry_receipt_ta(**kwargs)
        return MessageTemplates.entry_receipt_en(**kwargs)
    
    # Daily Summary Templates
    @staticmethod
    def daily_summary_en(
        farmer_name: str,
        date: datetime,
        entries: list,
        total_weight: float,
        total_amount: float
    ) -> str:
        """Daily summary template in English."""
        entries_text = "\n".join([
            f"• {e['flower_type']}: {e['quantity']:.2f} kg @ {MessageTemplates.format_currency(e['rate'])}/kg"
            for e in entries[:5]  # Limit to 5 entries to avoid length issues
        ])
        
        if len(entries) > 5:
            entries_text += f"\n• ... and {len(entries) - 5} more entries"
        
        return (
            f"📊 *Today's Summary*\n\n"
            f"👤 Farmer: {farmer_name}\n"
            f"📅 Date: {MessageTemplates.format_date(date)}\n\n"
            f"*Entries:*\n{entries_text}\n\n"
            f"⚖️ Total Weight: {total_weight:.2f} kg\n"
            f"💰 Total Value: {MessageTemplates.format_currency(total_amount)}\n\n"
            f"_Reply '1' for today's details, '2' for monthly summary_"
        )
    
    @staticmethod
    def daily_summary_ta(
        farmer_name: str,
        date: datetime,
        entries: list,
        total_weight: float,
        total_amount: float
    ) -> str:
        """Daily summary template in Tamil."""
        entries_text = "\n".join([
            f"• {e['flower_type']}: {e['quantity']:.2f} கிலோ @ {MessageTemplates.format_currency(e['rate'])}/கிலோ"
            for e in entries[:5]
        ])
        
        if len(entries) > 5:
            entries_text += f"\n• ... மற்றும் {len(entries) - 5} பதிவுகள்"
        
        return (
            f"📊 *இன்றைய சுருக்கம்*\n\n"
            f"👤 விவசாயி: {farmer_name}\n"
            f"📅 தேதி: {MessageTemplates.format_date_ta(date)}\n\n"
            f"*பதிவுகள்:*\n{entries_text}\n\n"
            f"⚖️ மொத்த எடை: {total_weight:.2f} கிலோ\n"
            f"💰 மொத்த மதிப்பு: {MessageTemplates.format_currency(total_amount)}\n\n"
            f"_இன்றைய விவரங்களுக்கு '1' என்று பதிலளிக்கவும்_"
        )
    
    @staticmethod
    def get_daily_summary(language: Language, **kwargs) -> str:
        """Get daily summary in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.daily_summary_ta(**kwargs)
        return MessageTemplates.daily_summary_en(**kwargs)
    
    # Monthly Summary Templates
    @staticmethod
    def monthly_summary_en(
        farmer_name: str,
        month: str,
        total_entries: int,
        total_weight: float,
        gross_amount: float,
        net_amount: float,
        pending_advances: float
    ) -> str:
        """Monthly summary template in English."""
        return (
            f"📈 *Monthly Summary*\n\n"
            f"👤 Farmer: {farmer_name}\n"
            f"📅 Month: {month}\n\n"
            f"📊 Statistics:\n"
            f"• Total Entries: {total_entries}\n"
            f"• Total Weight: {total_weight:.2f} kg\n"
            f"• Gross Amount: {MessageTemplates.format_currency(gross_amount)}\n"
            f"• Net Amount: {MessageTemplates.format_currency(net_amount)}\n"
            f"• Pending Advances: {MessageTemplates.format_currency(pending_advances)}\n\n"
            f"_Reply '3' for advance status_"
        )
    
    @staticmethod
    def monthly_summary_ta(
        farmer_name: str,
        month: str,
        total_entries: int,
        total_weight: float,
        gross_amount: float,
        net_amount: float,
        pending_advances: float
    ) -> str:
        """Monthly summary template in Tamil."""
        return (
            f"📈 *மாதாந்திர சுருக்கம்*\n\n"
            f"👤 விவசாயி: {farmer_name}\n"
            f"📅 மாதம்: {month}\n\n"
            f"📊 புள்ளிவிவரங்கள்:\n"
            f"• மொத்த பதிவுகள்: {total_entries}\n"
            f"• மொத்த எடை: {total_weight:.2f} கிலோ\n"
            f"• மொத்த தொகை: {MessageTemplates.format_currency(gross_amount)}\n"
            f"• நிகர தொகை: {MessageTemplates.format_currency(net_amount)}\n"
            f"• நிலுவை முன்பணம்: {MessageTemplates.format_currency(pending_advances)}\n\n"
            f"_முன்பண நிலைக்கு '3' என்று பதிலளிக்கவும்_"
        )
    
    @staticmethod
    def get_monthly_summary(language: Language, **kwargs) -> str:
        """Get monthly summary in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.monthly_summary_ta(**kwargs)
        return MessageTemplates.monthly_summary_en(**kwargs)
    
    # Advance Status Templates
    @staticmethod
    def advance_status_en(
        farmer_name: str,
        pending_advances: list,
        total_pending: float
    ) -> str:
        """Advance status template in English."""
        if not pending_advances:
            return (
                f"✅ *Advance Status*\n\n"
                f"👤 Farmer: {farmer_name}\n\n"
                f"No pending advances.\n"
                f"_All advances have been settled._"
            )
        
        advances_text = "\n".join([
            f"• {MessageTemplates.format_date(a['date'])}: {MessageTemplates.format_currency(a['amount'])} - {a['reason']}"
            for a in pending_advances[:5]
        ])
        
        if len(pending_advances) > 5:
            advances_text += f"\n• ... and {len(pending_advances) - 5} more"
        
        return (
            f"💳 *Advance Status*\n\n"
            f"👤 Farmer: {farmer_name}\n\n"
            f"*Pending Advances:*\n{advances_text}\n\n"
            f"💰 Total Pending: {MessageTemplates.format_currency(total_pending)}\n\n"
            f"_Contact admin for settlement details_"
        )
    
    @staticmethod
    def advance_status_ta(
        farmer_name: str,
        pending_advances: list,
        total_pending: float
    ) -> str:
        """Advance status template in Tamil."""
        if not pending_advances:
            return (
                f"✅ *முன்பண நிலை*\n\n"
                f"👤 விவசாயி: {farmer_name}\n\n"
                f"நிலுவை முன்பணம் இல்லை.\n"
                f"_அனைத்து முன்பணங்களும் தீர்க்கப்பட்டன._"
            )
        
        advances_text = "\n".join([
            f"• {MessageTemplates.format_date(a['date'])}: {MessageTemplates.format_currency(a['amount'])} - {a['reason']}"
            for a in pending_advances[:5]
        ])
        
        if len(pending_advances) > 5:
            advances_text += f"\n• ... மற்றும் {len(pending_advances) - 5}"
        
        return (
            f"💳 *முன்பண நிலை*\n\n"
            f"👤 விவசாயி: {farmer_name}\n\n"
            f"*நிலுவை முன்பணங்கள்:*\n{advances_text}\n\n"
            f"💰 மொத்த நிலுவை: {MessageTemplates.format_currency(total_pending)}\n\n"
            f"_தீர்வு விவரங்களுக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்_"
        )
    
    @staticmethod
    def get_advance_status(language: Language, **kwargs) -> str:
        """Get advance status in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.advance_status_ta(**kwargs)
        return MessageTemplates.advance_status_en(**kwargs)
    
    # Settlement Notification Templates
    @staticmethod
    def settlement_notification_en(
        farmer_name: str,
        settlement_number: str,
        period_start: datetime,
        period_end: datetime,
        net_payable: float,
        status: str
    ) -> str:
        """Settlement notification template in English."""
        return (
            f"💰 *Settlement Notification*\n\n"
            f"👤 Farmer: {farmer_name}\n"
            f"📋 Settlement: {settlement_number}\n"
            f"📅 Period: {MessageTemplates.format_date(period_start)} to {MessageTemplates.format_date(period_end)}\n"
            f"💵 Net Payable: {MessageTemplates.format_currency(net_payable)}\n"
            f"📊 Status: {status.upper()}\n\n"
            f"_Payment will be processed within 3-5 working days._"
        )
    
    @staticmethod
    def settlement_notification_ta(
        farmer_name: str,
        settlement_number: str,
        period_start: datetime,
        period_end: datetime,
        net_payable: float,
        status: str
    ) -> str:
        """Settlement notification template in Tamil."""
        return (
            f"💰 *தீர்வை அறிவிப்பு*\n\n"
            f"👤 விவசாயி: {farmer_name}\n"
            f"📋 தீர்வை: {settlement_number}\n"
            f"📅 காலம்: {MessageTemplates.format_date_ta(period_start)} முதல் {MessageTemplates.format_date_ta(period_end)} வரை\n"
            f"💵 நிகர செலுத்தப்படு தொகை: {MessageTemplates.format_currency(net_payable)}\n"
            f"📊 நிலை: {status.upper()}\n\n"
            f"_கடன் செலுத்தம் 3-5 வேலை நாட்களுக்குள் செய்யப்படும்._"
        )
    
    @staticmethod
    def get_settlement_notification(language: Language, **kwargs) -> str:
        """Get settlement notification in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.settlement_notification_ta(**kwargs)
        return MessageTemplates.settlement_notification_en(**kwargs)
    
    # Help Message Templates
    @staticmethod
    def help_message_en() -> str:
        """Help message template in English."""
        return (
            f"📱 *Malar Market Bot Help*\n\n"
            f"*Available Commands:*\n\n"
            f"1️⃣ Reply '1' - Today's weight & rate\n"
            f"2️⃣ Reply '2' - Monthly summary\n"
            f"3️⃣ Reply '3' - Pending advances\n"
            f"❓ Reply 'help' - Show this help\n\n"
            f"*Tamil Commands:*\n"
            f"• 'இன்றைய வரவு' - Today's entries\n"
            f"• 'மாதாந்திர அறிக்கை' - Monthly summary\n"
            f"• 'முன்பணம்' - Pending advances\n"
            f"• 'உதவி' - Help\n\n"
            f"_Contact admin for support_"
        )
    
    @staticmethod
    def help_message_ta() -> str:
        """Help message template in Tamil."""
        return (
            f"📱 *மலர் சந்தை போட் உதவி*\n\n"
            f"*கிடைக்கும் கட்டளைகள்:*\n\n"
            f"1️⃣ '1' என்று பதிலளி - இன்றைய எடை & விலை\n"
            f"2️⃣ '2' என்று பதிலளி - மாதாந்திர சுருக்கம்\n"
            f"3️⃣ '3' என்று பதிலளி - நிலுவை முன்பணம்\n"
            f"❓ 'help' என்று பதிலளி - உதவி காட்டு\n\n"
            f"*தமிழ் கட்டளைகள்:*\n"
            f"• 'இன்றைய வரவு' - இன்றைய பதிவுகள்\n"
            f"• 'மாதாந்திர அறிக்கை' - மாதாந்திர சுருக்கம்\n"
            f"• 'முன்பணம்' - நிலுவை முன்பணம்\n"
            f"• 'உதவி' - உதவி\n\n"
            f"_ஆதரவுக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்_"
        )
    
    @staticmethod
    def get_help_message(language: Language) -> str:
        """Get help message in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.help_message_ta()
        return MessageTemplates.help_message_en()
    
    # Error Message Templates
    @staticmethod
    def error_message_en(message: str) -> str:
        """Error message template in English."""
        return (
            f"❌ *Error*\n\n"
            f"{message}\n\n"
            f"_Reply 'help' for available commands_"
        )
    
    @staticmethod
    def error_message_ta(message: str) -> str:
        """Error message template in Tamil."""
        return (
            f"❌ *பிழை*\n\n"
            f"{message}\n\n"
            f"_கிடைக்கும் கட்டளைகளுக்கு 'help' என்று பதிலளிக்கவும்_"
        )
    
    @staticmethod
    def get_error_message(language: Language, message: str) -> str:
        """Get error message in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.error_message_ta(message)
        return MessageTemplates.error_message_en(message)
    
    # Invalid Command Template
    @staticmethod
    def invalid_command_en() -> str:
        """Invalid command message in English."""
        return MessageTemplates.error_message_en(
            "Invalid command. Please use one of the available commands."
        )
    
    @staticmethod
    def invalid_command_ta() -> str:
        """Invalid command message in Tamil."""
        return MessageTemplates.error_message_ta(
            "தவறான கட்டளை. கிடைக்கும் கட்டளைகளில் ஒன்றைப் பயன்படுத்தவும்."
        )
    
    @staticmethod
    def get_invalid_command(language: Language) -> str:
        """Get invalid command message in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.invalid_command_ta()
        return MessageTemplates.invalid_command_en()
    
    # Farmer Not Found Template
    @staticmethod
    def farmer_not_found_en() -> str:
        """Farmer not found message in English."""
        return MessageTemplates.error_message_en(
            "Farmer not found. Please contact admin to register your phone number."
        )
    
    @staticmethod
    def farmer_not_found_ta() -> str:
        """Farmer not found message in Tamil."""
        return MessageTemplates.error_message_ta(
            "விவசாயி காணப்படவில்லை. உங்கள் தொலைபேசி எண்ணைப் பதிவு செய்ய நிர்வாகியைத் தொடர்பு கொள்ளவும்."
        )
    
    @staticmethod
    def get_farmer_not_found(language: Language) -> str:
        """Get farmer not found message in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.farmer_not_found_ta()
        return MessageTemplates.farmer_not_found_en()
    
    # No Data Available Template
    @staticmethod
    def no_data_available_en(data_type: str) -> str:
        """No data available message in English."""
        return (
            f"📭 *No Data*\n\n"
            f"No {data_type} available for your account.\n\n"
            f"_Reply 'help' for available commands_"
        )
    
    @staticmethod
    def no_data_available_ta(data_type: str) -> str:
        """No data available message in Tamil."""
        return (
            f"📭 *தரவு இல்லை*\n\n"
            f"உங்கள் கணக்கிற்கு {data_type} கிடைக்கவில்லை.\n\n"
            f"_கிடைக்கும் கட்டளைகளுக்கு 'help' என்று பதிலளிக்கவும்_"
        )
    
    @staticmethod
    def get_no_data_available(language: Language, data_type: str) -> str:
        """Get no data available message in specified language."""
        if language == Language.TAMIL:
            return MessageTemplates.no_data_available_ta(data_type)
        return MessageTemplates.no_data_available_en(data_type)


# Helper function to detect language from message
def detect_language(message: str) -> Language:
    """
    Detect language from message content.
    
    Args:
        message: The message text
        
    Returns:
        Detected language (ENGLISH or TAMIL)
    """
    # Tamil Unicode range: U+0B80 to U+0BFF
    tamil_chars = set(range(0x0B80, 0x0BFF + 1))
    
    # Check for Tamil characters
    for char in message:
        if ord(char) in tamil_chars:
            return Language.TAMIL
    
    # Check for Tamil keywords
    tamil_keywords = ['இன்றைய', 'வரவு', 'மாதாந்திர', 'அறிக்கை', 'முன்பணம்', 'உதவி', 'தீர்வை']
    for keyword in tamil_keywords:
        if keyword in message.lower():
            return Language.TAMIL
    
    # Default to English
    return Language.ENGLISH
