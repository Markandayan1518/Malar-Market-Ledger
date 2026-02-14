"""Helper functions for WhatsApp integration with daily entries and settlements."""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.settlement import Settlement
from app.services.whatsapp_service import whatsapp_service
from app.services.message_templates import (
    MessageType, Language, MessageTemplates
)
from app.models.whatsapp_log import WhatsappLog
from app.models.whatsapp_log import MessageStatus
import uuid

logger = logging.getLogger(__name__)


async def send_entry_receipt(
    entry: DailyEntry,
    farmer: Farmer,
    db: AsyncSession
) -> bool:
    """
    Send WhatsApp receipt after daily entry is saved.
    
    Args:
        entry: The daily entry that was just saved
        farmer: The farmer associated with the entry
        db: Database session
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Determine farmer's language preference
        language = _get_farmer_language(farmer)
        
        # Get flower type name
        flower_name = entry.flower_type.name if entry.flower_type else "Unknown"
        
        # Generate receipt message
        message = MessageTemplates.get_entry_receipt(
            language=language,
            farmer_name=farmer.name,
            date=datetime.combine(entry.entry_date, datetime.min.time()),
            flower_type=flower_name,
            quantity=entry.quantity,
            rate=entry.rate_per_unit,
            total_amount=entry.total_amount,
            net_amount=entry.net_amount
        )
        
        # Get phone number
        phone_number = farmer.whatsapp_number or farmer.phone
        
        if not phone_number:
            logger.warning(f"No phone number for farmer {farmer.id}, skipping WhatsApp receipt")
            return False
        
        # Send message with high priority
        result = await whatsapp_service.send_message(
            to_phone=phone_number,
            message=message,
            message_type=MessageType.ENTRY_RECEIPT,
            priority="high"
        )
        
        if result.get("success"):
            # Log the message
            await log_whatsapp_message(
                db=db,
                phone_number=phone_number,
                message=message,
                message_type=MessageType.ENTRY_RECEIPT,
                status=MessageStatus.QUEUED,
                provider_message_id=result.get("message_id"),
                related_entry_id=entry.id
            )
            logger.info(f"WhatsApp receipt sent for entry {entry.id} to {phone_number}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp receipt for entry {entry.id}: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending entry receipt: {str(e)}")
        return False


async def send_settlement_notification(
    settlement: Settlement,
    farmer: Farmer,
    db: AsyncSession
) -> bool:
    """
    Send WhatsApp notification when settlement is approved.
    
    Args:
        settlement: The settlement that was approved
        farmer: The farmer associated with the settlement
        db: Database session
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Determine farmer's language preference
        language = _get_farmer_language(farmer)
        
        # Generate settlement notification message
        message = MessageTemplates.get_settlement_notification(
            language=language,
            farmer_name=farmer.name,
            settlement_number=settlement.settlement_number,
            period_start=settlement.period_start,
            period_end=settlement.period_end,
            net_payable=settlement.net_payable,
            status=settlement.status
        )
        
        # Get phone number
        phone_number = farmer.whatsapp_number or farmer.phone
        
        if not phone_number:
            logger.warning(f"No phone number for farmer {farmer.id}, skipping WhatsApp notification")
            return False
        
        # Send message with high priority
        result = await whatsapp_service.send_message(
            to_phone=phone_number,
            message=message,
            message_type=MessageType.SETTLEMENT_NOTIFICATION,
            priority="high"
        )
        
        if result.get("success"):
            # Log the message
            await log_whatsapp_message(
                db=db,
                phone_number=phone_number,
                message=message,
                message_type=MessageType.SETTLEMENT_NOTIFICATION,
                status=MessageStatus.QUEUED,
                provider_message_id=result.get("message_id"),
                related_settlement_id=settlement.id
            )
            logger.info(f"WhatsApp settlement notification sent for settlement {settlement.id} to {phone_number}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp settlement notification for settlement {settlement.id}: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending settlement notification: {str(e)}")
        return False


async def log_whatsapp_message(
    db: AsyncSession,
    phone_number: str,
    message: str,
    message_type: MessageType,
    status: MessageStatus,
    provider_message_id: Optional[str] = None,
    error_message: Optional[str] = None,
    related_entry_id: Optional[str] = None,
    related_settlement_id: Optional[str] = None
) -> None:
    """
    Log WhatsApp message to database.
    
    Args:
        db: Database session
        phone_number: Recipient phone number
        message: Message content
        message_type: Type of message
        status: Delivery status
        provider_message_id: Provider's message ID
        error_message: Error message if failed
        related_entry_id: Related daily entry ID
        related_settlement_id: Related settlement ID
    """
    try:
        log = WhatsappLog(
            id=str(uuid.uuid4()),
            phone_number=phone_number,
            message=message,
            status=status.value,
            delivery_status=None,
            error_message=error_message,
            sent_at=datetime.utcnow() if status == MessageStatus.SENT else None
        )
        
        db.add(log)
        await db.commit()
        
        logger.info(f"Logged WhatsApp message: {phone_number}, type: {message_type.value}, status: {status.value}")
        
    except Exception as e:
        logger.error(f"Error logging WhatsApp message: {str(e)}")
        await db.rollback()


def _get_farmer_language(farmer: Farmer) -> Language:
    """
    Get farmer's language preference.
    
    Args:
        farmer: Farmer object
        
    Returns:
        Language preference (ENGLISH or TAMIL)
    """
    # Check if farmer has a language preference field
    if hasattr(farmer, 'language_preference') and farmer.language_preference:
        lang = farmer.language_preference.lower()
        if lang == 'ta' or lang == 'tamil':
            return Language.TAMIL
    
    # Default to English
    return Language.ENGLISH


async def update_delivery_status(
    db: AsyncSession,
    message_id: str,
    status: MessageStatus,
    delivery_status: Optional[str] = None
) -> bool:
    """
    Update delivery status of a WhatsApp message.
    
    Args:
        db: Database session
        message_id: WhatsApp log message ID
        status: New delivery status
        delivery_status: Provider's delivery status
        
    Returns:
        True if successful, False otherwise
    """
    try:
        result = await db.execute(
            select(WhatsappLog).where(WhatsappLog.id == message_id)
        )
        log = result.scalar_one_or_none()
        
        if not log:
            logger.warning(f"WhatsApp log not found for message ID: {message_id}")
            return False
        
        log.status = status.value
        log.delivery_status = delivery_status
        
        if status == MessageStatus.DELIVERED or status == MessageStatus.READ:
            log.delivered_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Updated delivery status for message {message_id}: {status.value}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating delivery status: {str(e)}")
        await db.rollback()
        return False
