"""Bot command handler for WhatsApp farmer self-service queries."""

import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.farmer import Farmer
from app.models.daily_entry import DailyEntry
from app.models.cash_advance import CashAdvance
from app.models.settlement import Settlement
from app.services.message_templates import (
    Language, MessageType, MessageTemplates, detect_language
)
from app.models.security_log import SecurityLog

logger = logging.getLogger(__name__)


class BotCommandHandler:
    """
    Handler for WhatsApp bot commands.
    
    Processes incoming messages and responds with farmer information.
    """
    
    # Command mappings
    COMMANDS = {
        "1": "daily_summary",
        "இன்றைய வரவு": "daily_summary",
        "2": "monthly_summary",
        "மாதாந்திர அறிக்கை": "monthly_summary",
        "3": "advance_status",
        "முன்பணம்": "advance_status",
        "help": "help",
        "உதவி": "help"
    }
    
    def __init__(self):
        self.templates = MessageTemplates()
    
    async def handle_message(
        self,
        phone_number: str,
        message: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Handle incoming WhatsApp message.
        
        Args:
            phone_number: Sender's phone number
            message: Message content
            db: Database session
            
        Returns:
            Response dict with message to send
        """
        try:
            # Detect language
            language = detect_language(message)
            
            # Clean and normalize message
            clean_message = message.strip().lower()
            
            # Log the interaction for security
            await self._log_interaction(phone_number, clean_message, db)
            
            # Check rate limit
            if not await self._check_rate_limit(phone_number, db):
                return self._get_rate_limit_response(language)
            
            # Identify farmer
            farmer = await self._get_farmer_by_phone(phone_number, db)
            
            if not farmer:
                return {
                    "success": True,
                    "message": MessageTemplates.get_farmer_not_found(language),
                    "message_type": MessageType.BOT_RESPONSE,
                    "language": language.value
                }
            
            # Parse command
            command = self._parse_command(clean_message)
            
            if not command:
                return {
                    "success": True,
                    "message": MessageTemplates.get_invalid_command(language),
                    "message_type": MessageType.BOT_RESPONSE,
                    "language": language.value
                }
            
            # Execute command
            response = await self._execute_command(
                command=command,
                farmer=farmer,
                language=language,
                db=db
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _parse_command(self, message: str) -> Optional[str]:
        """
        Parse command from message.
        
        Args:
            message: Cleaned message text
            
        Returns:
            Command type or None
        """
        # Direct command match
        if message in self.COMMANDS:
            return self.COMMANDS[message]
        
        # Check if message starts with a command
        for cmd, cmd_type in self.COMMANDS.items():
            if message.startswith(cmd.lower()):
                return cmd_type
        
        return None
    
    async def _execute_command(
        self,
        command: str,
        farmer: Farmer,
        language: Language,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Execute bot command.
        
        Args:
            command: Command type
            farmer: Farmer object
            language: User's language preference
            db: Database session
            
        Returns:
            Response dict with message
        """
        try:
            if command == "daily_summary":
                return await self._handle_daily_summary(farmer, language, db)
            elif command == "monthly_summary":
                return await self._handle_monthly_summary(farmer, language, db)
            elif command == "advance_status":
                return await self._handle_advance_status(farmer, language, db)
            elif command == "help":
                return {
                    "success": True,
                    "message": MessageTemplates.get_help_message(language),
                    "message_type": MessageType.HELP_MESSAGE,
                    "language": language.value
                }
            else:
                return {
                    "success": True,
                    "message": MessageTemplates.get_invalid_command(language),
                    "message_type": MessageType.ERROR_MESSAGE,
                    "language": language.value
                }
                
        except Exception as e:
            logger.error(f"Error executing command {command}: {str(e)}")
            return {
                "success": True,
                "message": MessageTemplates.get_error_message(
                    language,
                    "An error occurred processing your request. Please try again."
                ),
                "message_type": MessageType.ERROR_MESSAGE,
                "language": language.value
            }
    
    async def _handle_daily_summary(
        self,
        farmer: Farmer,
        language: Language,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle daily summary command."""
        try:
            today = date.today()
            
            # Get today's entries
            result = await db.execute(
                select(DailyEntry)
                .where(
                    and_(
                        DailyEntry.farmer_id == farmer.id,
                        DailyEntry.entry_date == today
                    )
                )
                .order_by(DailyEntry.entry_time)
            )
            entries = result.scalars().all()
            
            if not entries:
                return {
                    "success": True,
                    "message": MessageTemplates.get_no_data_available(
                        language,
                        "today's entries"
                    ),
                    "message_type": MessageType.BOT_RESPONSE,
                    "language": language.value
                }
            
            # Calculate totals
            total_weight = sum(e.quantity for e in entries)
            total_amount = sum(e.net_amount for e in entries)
            
            # Prepare entries list for template
            entries_list = [
                {
                    "flower_type": e.flower_type.name if e.flower_type else "Unknown",
                    "quantity": e.quantity,
                    "rate": e.rate_per_unit
                }
                for e in entries
            ]
            
            # Get message
            message = MessageTemplates.get_daily_summary(
                language=language,
                farmer_name=farmer.name,
                date=datetime.combine(today, datetime.min.time()),
                entries=entries_list,
                total_weight=total_weight,
                total_amount=total_amount
            )
            
            return {
                "success": True,
                "message": message,
                "message_type": MessageType.DAILY_SUMMARY,
                "language": language.value
            }
            
        except Exception as e:
            logger.error(f"Error getting daily summary: {str(e)}")
            raise
    
    async def _handle_monthly_summary(
        self,
        farmer: Farmer,
        language: Language,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle monthly summary command."""
        try:
            today = date.today()
            month_start = date(today.year, today.month, 1)
            
            # Get month's entries
            result = await db.execute(
                select(DailyEntry)
                .where(
                    and_(
                        DailyEntry.farmer_id == farmer.id,
                        DailyEntry.entry_date >= month_start,
                        DailyEntry.entry_date <= today
                    )
                )
            )
            entries = result.scalars().all()
            
            if not entries:
                return {
                    "success": True,
                    "message": MessageTemplates.get_no_data_available(
                        language,
                        "monthly entries"
                    ),
                    "message_type": MessageType.BOT_RESPONSE,
                    "language": language.value
                }
            
            # Calculate totals
            total_entries = len(entries)
            total_weight = sum(e.quantity for e in entries)
            gross_amount = sum(e.total_amount for e in entries)
            net_amount = sum(e.net_amount for e in entries)
            
            # Get pending advances
            advance_result = await db.execute(
                select(func.sum(CashAdvance.amount))
                .where(
                    and_(
                        CashAdvance.farmer_id == farmer.id,
                        CashAdvance.status == "approved"
                    )
                )
            )
            pending_advances = advance_result.scalar() or 0.0
            
            # Get month name
            month_name = today.strftime("%B %Y")
            
            # Get message
            message = MessageTemplates.get_monthly_summary(
                language=language,
                farmer_name=farmer.name,
                month=month_name,
                total_entries=total_entries,
                total_weight=total_weight,
                gross_amount=gross_amount,
                net_amount=net_amount,
                pending_advances=pending_advances
            )
            
            return {
                "success": True,
                "message": message,
                "message_type": MessageType.MONTHLY_SUMMARY,
                "language": language.value
            }
            
        except Exception as e:
            logger.error(f"Error getting monthly summary: {str(e)}")
            raise
    
    async def _handle_advance_status(
        self,
        farmer: Farmer,
        language: Language,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle advance status command."""
        try:
            # Get pending advances
            result = await db.execute(
                select(CashAdvance)
                .where(
                    and_(
                        CashAdvance.farmer_id == farmer.id,
                        CashAdvance.status == "approved"
                    )
                )
                .order_by(CashAdvance.advance_date.desc())
            )
            advances = result.scalars().all()
            
            if not advances:
                return {
                    "success": True,
                    "message": MessageTemplates.get_advance_status(
                        language=language,
                        farmer_name=farmer.name,
                        pending_advances=[],
                        total_pending=0.0
                    ),
                    "message_type": MessageType.ADVANCE_STATUS,
                    "language": language.value
                }
            
            # Prepare advances list
            advances_list = [
                {
                    "date": a.advance_date,
                    "amount": a.amount,
                    "reason": a.reason or "No reason provided"
                }
                for a in advances
            ]
            
            # Calculate total pending
            total_pending = sum(a.amount for a in advances)
            
            # Get message
            message = MessageTemplates.get_advance_status(
                language=language,
                farmer_name=farmer.name,
                pending_advances=advances_list,
                total_pending=total_pending
            )
            
            return {
                "success": True,
                "message": message,
                "message_type": MessageType.ADVANCE_STATUS,
                "language": language.value
            }
            
        except Exception as e:
            logger.error(f"Error getting advance status: {str(e)}")
            raise
    
    async def _get_farmer_by_phone(
        self,
        phone_number: str,
        db: AsyncSession
    ) -> Optional[Farmer]:
        """Get farmer by phone number."""
        try:
            # Normalize phone number (remove +91, spaces, dashes)
            normalized_phone = phone_number.replace("+91", "").replace(" ", "").replace("-", "")
            
            # Try whatsapp_number first, then phone
            result = await db.execute(
                select(Farmer).where(
                    func.replace(Farmer.whatsapp_number, "+91", "") == normalized_phone
                )
            )
            farmer = result.scalar_one_or_none()
            
            if not farmer:
                result = await db.execute(
                    select(Farmer).where(
                        func.replace(Farmer.phone, "+91", "") == normalized_phone
                    )
                )
                farmer = result.scalar_one_or_none()
            
            return farmer
            
        except Exception as e:
            logger.error(f"Error getting farmer by phone: {str(e)}")
            return None
    
    async def _check_rate_limit(
        self,
        phone_number: str,
        db: AsyncSession
    ) -> bool:
        """
        Check rate limit for bot commands.
        
        Max 10 commands per minute per farmer.
        """
        try:
            one_minute_ago = datetime.utcnow().replace(second=0, microsecond=0)
            
            # Count recent interactions
            result = await db.execute(
                select(func.count(SecurityLog.id))
                .where(
                    and_(
                        SecurityLog.phone_number == phone_number,
                        SecurityLog.action == "whatsapp_bot_command",
                        SecurityLog.created_at >= one_minute_ago
                    )
                )
            )
            count = result.scalar() or 0
            
            return count < 10
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {str(e)}")
            return True  # Allow on error
    
    async def _log_interaction(
        self,
        phone_number: str,
        message: str,
        db: AsyncSession
    ) -> None:
        """Log bot interaction for security."""
        try:
            log = SecurityLog(
                phone_number=phone_number,
                action="whatsapp_bot_command",
                details=f"Bot command: {message}",
                ip_address=None,  # Not applicable for WhatsApp
                user_agent="WhatsApp Bot"
            )
            db.add(log)
            await db.commit()
            
        except Exception as e:
            logger.error(f"Error logging interaction: {str(e)}")
    
    def _get_rate_limit_response(self, language: Language) -> Dict[str, Any]:
        """Get rate limit exceeded response."""
        if language == Language.TAMIL:
            message = "விரைவில் அதிக கோரிக்கைகள். தயவு செய்து சில நிமிடங்களில் மீண்டும் முயற்சிக்கவும்."
        else:
            message = "Too many requests. Please wait a few minutes and try again."
        
        return {
            "success": True,
            "message": message,
            "message_type": MessageType.ERROR_MESSAGE,
            "language": language.value
        }


# Global handler instance
bot_handler = BotCommandHandler()
