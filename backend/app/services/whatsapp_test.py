"""Testing utilities for WhatsApp integration."""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date

from app.services.whatsapp_service import (
    WhatsAppService, WhatsAppProvider, TwilioProvider, InteraktProvider,
    MessageStatus
)
from app.services.bot_handler import BotCommandHandler
from app.services.message_templates import (
    Language, MessageType, MessageTemplates
)

logger = logging.getLogger(__name__)


class MockWhatsAppProvider:
    """Mock WhatsApp provider for testing."""
    
    def __init__(self):
        self.sent_messages = []
        self.message_id_counter = 0
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        template_id: Optional[str] = None,
        template_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Mock send message."""
        self.message_id_counter += 1
        message_id = f"mock_msg_{self.message_id_counter}"
        
        # Store message for verification
        self.sent_messages.append({
            "id": message_id,
            "to_phone": to_phone,
            "message": message,
            "template_id": template_id,
            "template_params": template_params,
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Mock: Message sent to {to_phone}: {message[:50]}...")
        
        return {
            "success": True,
            "message_id": message_id,
            "status": MessageStatus.QUEUED,
            "provider": "mock"
        }
    
    async def validate_webhook(self, payload: Dict[str, Any], signature: str) -> bool:
        """Mock webhook validation - always returns True."""
        return True
    
    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mock webhook parsing."""
        return {
            "phone_number": payload.get("From", "mock_phone"),
            "message": payload.get("Body", "mock message").strip(),
            "message_id": payload.get("MessageSid", "mock_sid"),
            "timestamp": datetime.utcnow(),
            "provider": "mock"
        }
    
    def get_sent_messages(self) -> List[Dict[str, Any]]:
        """Get all sent messages for testing."""
        return self.sent_messages
    
    def clear_messages(self) -> None:
        """Clear sent messages."""
        self.sent_messages = []


class WhatsAppTestUtils:
    """Utilities for testing WhatsApp integration."""
    
    def __init__(self):
        self.mock_provider = MockWhatsAppProvider()
        self.templates = MessageTemplates()
        self.bot_handler = BotCommandHandler()
    
    async def test_send_message(
        self,
        phone_number: str,
        message: str,
        message_type: MessageType = MessageType.BOT_RESPONSE
    ) -> Dict[str, Any]:
        """
        Test sending a message.
        
        Args:
            phone_number: Recipient phone number
            message: Message content
            message_type: Type of message
            
        Returns:
            Result dict
        """
        result = await self.mock_provider.send_message(
            to_phone=phone_number,
            message=message,
            message_type=message_type
        )
        
        return result
    
    async def test_entry_receipt(
        self,
        farmer_name: str = "Test Farmer",
        flower_type: str = "Rose",
        quantity: float = 10.5,
        rate: float = 150.0,
        total_amount: float = 1575.0,
        net_amount: float = 1496.25
    ) -> Dict[str, Any]:
        """
        Test entry receipt template.
        
        Args:
            farmer_name: Farmer name
            flower_type: Flower type
            quantity: Weight in kg
            rate: Rate per kg
            total_amount: Total amount
            net_amount: Net amount after commission
            
        Returns:
            Result dict with message content
        """
        # English version
        message_en = self.templates.get_entry_receipt(
            language=Language.ENGLISH,
            farmer_name=farmer_name,
            date=datetime.combine(date.today(), datetime.min.time()),
            flower_type=flower_type,
            quantity=quantity,
            rate=rate,
            total_amount=total_amount,
            net_amount=net_amount
        )
        
        # Tamil version
        message_ta = self.templates.get_entry_receipt(
            language=Language.TAMIL,
            farmer_name=farmer_name,
            date=datetime.combine(date.today(), datetime.min.time()),
            flower_type=flower_type,
            quantity=quantity,
            rate=rate,
            total_amount=total_amount,
            net_amount=net_amount
        )
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_daily_summary(
        self,
        farmer_name: str = "Test Farmer",
        entries: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Test daily summary template.
        
        Args:
            farmer_name: Farmer name
            entries: List of entries (optional)
            
        Returns:
            Result dict with message content
        """
        if entries is None:
            entries = [
                {"flower_type": "Rose", "quantity": 10.5, "rate": 150.0},
                {"flower_type": "Jasmine", "quantity": 5.0, "rate": 120.0},
                {"flower_type": "Marigold", "quantity": 7.5, "rate": 100.0}
            ]
        
        total_weight = sum(e["quantity"] for e in entries)
        total_amount = sum(e["quantity"] * e["rate"] for e in entries)
        
        # English version
        message_en = self.templates.get_daily_summary(
            language=Language.ENGLISH,
            farmer_name=farmer_name,
            date=datetime.combine(date.today(), datetime.min.time()),
            entries=entries,
            total_weight=total_weight,
            total_amount=total_amount
        )
        
        # Tamil version
        message_ta = self.templates.get_daily_summary(
            language=Language.TAMIL,
            farmer_name=farmer_name,
            date=datetime.combine(date.today(), datetime.min.time()),
            entries=entries,
            total_weight=total_weight,
            total_amount=total_amount
        )
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_monthly_summary(
        self,
        farmer_name: str = "Test Farmer",
        month: str = "February 2026",
        total_entries: int = 25,
        total_weight: float = 250.0,
        gross_amount: float = 37500.0,
        net_amount: float = 35625.0,
        pending_advances: float = 5000.0
    ) -> Dict[str, Any]:
        """
        Test monthly summary template.
        
        Args:
            farmer_name: Farmer name
            month: Month string
            total_entries: Total entries
            total_weight: Total weight
            gross_amount: Gross amount
            net_amount: Net amount
            pending_advances: Pending advances
            
        Returns:
            Result dict with message content
        """
        # English version
        message_en = self.templates.get_monthly_summary(
            language=Language.ENGLISH,
            farmer_name=farmer_name,
            month=month,
            total_entries=total_entries,
            total_weight=total_weight,
            gross_amount=gross_amount,
            net_amount=net_amount,
            pending_advances=pending_advances
        )
        
        # Tamil version
        message_ta = self.templates.get_monthly_summary(
            language=Language.TAMIL,
            farmer_name=farmer_name,
            month=month,
            total_entries=total_entries,
            total_weight=total_weight,
            gross_amount=gross_amount,
            net_amount=net_amount,
            pending_advances=pending_advances
        )
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_advance_status(
        self,
        farmer_name: str = "Test Farmer",
        pending_advances: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Test advance status template.
        
        Args:
            farmer_name: Farmer name
            pending_advances: List of pending advances (optional)
            
        Returns:
            Result dict with message content
        """
        if pending_advances is None:
            pending_advances = [
                {"date": date(2026, 2, 10), "amount": 5000.0, "reason": "Emergency expense"},
                {"date": date(2026, 2, 5), "amount": 2000.0, "reason": "Medical bills"}
            ]
        
        total_pending = sum(a["amount"] for a in pending_advances)
        
        # English version
        message_en = self.templates.get_advance_status(
            language=Language.ENGLISH,
            farmer_name=farmer_name,
            pending_advances=pending_advances,
            total_pending=total_pending
        )
        
        # Tamil version
        message_ta = self.templates.get_advance_status(
            language=Language.TAMIL,
            farmer_name=farmer_name,
            pending_advances=pending_advances,
            total_pending=total_pending
        )
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_settlement_notification(
        self,
        farmer_name: str = "Test Farmer",
        settlement_number: str = "SET-2026-02-001",
        period_start: date = date(2026, 2, 1),
        period_end: date = date(2026, 2, 14),
        net_payable: float = 30125.00,
        status: str = "approved"
    ) -> Dict[str, Any]:
        """
        Test settlement notification template.
        
        Args:
            farmer_name: Farmer name
            settlement_number: Settlement number
            period_start: Period start date
            period_end: Period end date
            net_payable: Net payable amount
            status: Settlement status
            
        Returns:
            Result dict with message content
        """
        # English version
        message_en = self.templates.get_settlement_notification(
            language=Language.ENGLISH,
            farmer_name=farmer_name,
            settlement_number=settlement_number,
            period_start=period_start,
            period_end=period_end,
            net_payable=net_payable,
            status=status
        )
        
        # Tamil version
        message_ta = self.templates.get_settlement_notification(
            language=Language.TAMIL,
            farmer_name=farmer_name,
            settlement_number=settlement_number,
            period_start=period_start,
            period_end=period_end,
            net_payable=net_payable,
            status=status
        )
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_help_message(self) -> Dict[str, Any]:
        """Test help message template."""
        # English version
        message_en = self.templates.get_help_message(Language.ENGLISH)
        
        # Tamil version
        message_ta = self.templates.get_help_message(Language.TAMIL)
        
        return {
            "english": message_en,
            "tamil": message_ta,
            "success": True
        }
    
    async def test_language_detection(self, messages: List[str]) -> Dict[str, Language]:
        """
        Test language detection.
        
        Args:
            messages: List of messages to test
            
        Returns:
            Dict mapping messages to detected languages
        """
        results = {}
        for msg in messages:
            from app.services.message_templates import detect_language
            results[msg] = detect_language(msg)
        
        return results
    
    async def test_bot_command_parsing(self, commands: List[str]) -> Dict[str, Optional[str]]:
        """
        Test bot command parsing.
        
        Args:
            commands: List of commands to test
            
        Returns:
            Dict mapping commands to parsed command types
        """
        results = {}
        handler = BotCommandHandler()
        
        for cmd in commands:
            parsed = handler._parse_command(cmd)
            results[cmd] = parsed
        
        return results
    
    def get_mock_provider(self) -> MockWhatsAppProvider:
        """Get mock provider instance."""
        return self.mock_provider
    
    def print_message_preview(self, message: str, max_length: int = 80) -> None:
        """
        Print message preview for testing.
        
        Args:
            message: Message to preview
            max_length: Maximum line length
        """
        print("\n" + "=" * max_length)
        print("Message Preview:")
        print("=" * max_length)
        
        # Split message into lines
        lines = message.split('\n')
        for line in lines:
            if len(line) > max_length:
                # Split long lines
                for i in range(0, len(line), max_length):
                    print(line[i:i+max_length])
            else:
                print(line)
        
        print("=" * max_length + "\n")


async def run_all_tests():
    """Run all WhatsApp integration tests."""
    print("\n" + "=" * 80)
    print("WhatsApp Integration Tests")
    print("=" * 80 + "\n")
    
    utils = WhatsAppTestUtils()
    
    # Test 1: Entry Receipt
    print("Test 1: Entry Receipt Template")
    print("-" * 80)
    result = await utils.test_entry_receipt()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 2: Daily Summary
    print("Test 2: Daily Summary Template")
    print("-" * 80)
    result = await utils.test_daily_summary()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 3: Monthly Summary
    print("Test 3: Monthly Summary Template")
    print("-" * 80)
    result = await utils.test_monthly_summary()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 4: Advance Status
    print("Test 4: Advance Status Template")
    print("-" * 80)
    result = await utils.test_advance_status()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 5: Settlement Notification
    print("Test 5: Settlement Notification Template")
    print("-" * 80)
    result = await utils.test_settlement_notification()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 6: Help Message
    print("Test 6: Help Message Template")
    print("-" * 80)
    result = await utils.test_help_message()
    print(f"✓ English: {result['success']}")
    print(f"✓ Tamil: {result['success']}")
    utils.print_message_preview(result['english'])
    print()
    
    # Test 7: Language Detection
    print("Test 7: Language Detection")
    print("-" * 80)
    test_messages = [
        "Hello",
        "வணணமை",
        "1",
        "இன்றைய வரவு",
        "help",
        "உதவி"
    ]
    results = await utils.test_language_detection(test_messages)
    for msg, lang in results.items():
        print(f"  '{msg}' -> {lang.value}")
    print()
    
    # Test 8: Bot Command Parsing
    print("Test 8: Bot Command Parsing")
    print("-" * 80)
    test_commands = [
        "1",
        "2",
        "3",
        "help",
        "இன்றைய வரவு",
        "மாதாந்திர அறிக்கை",
        "முன்பணம்",
        "invalid"
    ]
    results = await utils.test_bot_command_parsing(test_commands)
    for cmd, parsed in results.items():
        print(f"  '{cmd}' -> {parsed if parsed else 'None'}")
    print()
    
    # Test 9: Send Message
    print("Test 9: Send Message")
    print("-" * 80)
    result = await utils.test_send_message(
        phone_number="+919876543210",
        message="Test message from WhatsApp integration"
    )
    print(f"✓ Message sent: {result['success']}")
    print(f"✓ Message ID: {result.get('message_id')}")
    print()
    
    print("=" * 80)
    print("All tests completed!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
