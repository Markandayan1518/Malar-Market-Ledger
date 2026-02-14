"""WhatsApp API routes for webhook, messaging, and administration."""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.whatsapp_log import WhatsappLog
from app.models.notification import Notification
from app.models.farmer import Farmer
from app.models.user import User
from app.core.auth import get_current_user, require_role
from app.services.whatsapp_service import whatsapp_service, MessageStatus
from app.services.bot_handler import bot_handler
from app.services.message_templates import MessageType, Language
from app.dependencies import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


# Request/Response Models
class WebhookPayload(BaseModel):
    """Webhook payload from WhatsApp provider."""
    """Dynamic payload - varies by provider"""
    pass


class SendMessageRequest(BaseModel):
    """Request to send WhatsApp message."""
    phone_number: str = Field(..., description="Recipient phone number")
    message: str = Field(..., description="Message content")
    message_type: str = Field(default="bot_response", description="Message type")
    priority: str = Field(default="normal", description="Message priority (high/normal)")
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if not v or len(v) < 10:
            raise ValueError('Invalid phone number')
        return v


class BroadcastMessageRequest(BaseModel):
    """Request to broadcast message to multiple recipients."""
    message: str = Field(..., description="Message content")
    phone_numbers: List[str] = Field(..., description="List of recipient phone numbers")
    message_type: str = Field(default="bot_response", description="Message type")
    priority: str = Field(default="normal", description="Message priority (high/normal)")
    
    @validator('phone_numbers')
    def validate_phone_numbers(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one phone number required')
        return v


class MessageLogResponse(BaseModel):
    """WhatsApp message log response."""
    id: str
    phone_number: str
    message: str
    status: str
    delivery_status: Optional[str]
    error_message: Optional[str]
    sent_at: Optional[datetime]
    created_at: datetime


class ServiceStatusResponse(BaseModel):
    """Service status response."""
    status: str
    provider: str
    queue_status: Dict[str, int]
    last_check: datetime


# Webhook endpoint
@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive incoming WhatsApp messages from provider webhook.
    
    This endpoint receives webhooks from WhatsApp providers (Twilio/Interakt)
    and processes bot commands from farmers.
    """
    try:
        # Get raw payload
        payload = await request.json()
        
        # Get signature header (if available)
        signature = request.headers.get("X-Twilio-Signature", "")
        
        # Validate and parse webhook
        webhook_result = await whatsapp_service.handle_webhook(payload, signature)
        
        if not webhook_result.get("success"):
            logger.error(f"Webhook validation failed: {webhook_result.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook"
            )
        
        webhook_data = webhook_result["data"]
        phone_number = webhook_data["phone_number"]
        message = webhook_data["message"]
        
        # Process bot command in background
        background_tasks.add_task(
            process_bot_command,
            phone_number,
            message,
            db
        )
        
        return {"status": "received"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


async def process_bot_command(
    phone_number: str,
    message: str,
    db: AsyncSession
):
    """
    Process bot command and send response.
    
    This function runs in the background to avoid blocking the webhook response.
    """
    try:
        # Handle the message
        response = await bot_handler.handle_message(phone_number, message, db)
        
        if response.get("success"):
            # Send response via WhatsApp
            await whatsapp_service.send_message(
                to_phone=phone_number,
                message=response["message"],
                message_type=MessageType(response.get("message_type", "bot_response")),
                priority="high"  # Bot responses get high priority
            )
            
            # Log the message
            await log_whatsapp_message(
                db=db,
                phone_number=phone_number,
                message=response["message"],
                message_type=MessageType(response.get("message_type", "bot_response")),
                status=MessageStatus.SENT,
                provider_message_id=response.get("message_id")
            )
        else:
            logger.error(f"Bot command failed: {response.get('error')}")
            
    except Exception as e:
        logger.error(f"Error processing bot command: {str(e)}")


# Send message endpoint
@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a WhatsApp message (admin/staff only).
    
    Allows administrators and staff to send direct messages to farmers.
    """
    try:
        # Check permissions
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Send message
        result = await whatsapp_service.send_message(
            to_phone=request.phone_number,
            message=request.message,
            message_type=MessageType(request.message_type),
            priority=request.priority
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send message: {result.get('error')}"
            )
        
        # Log the message
        await log_whatsapp_message(
            db=db,
            phone_number=request.phone_number,
            message=request.message,
            message_type=MessageType(request.message_type),
            status=MessageStatus.QUEUED,
            provider_message_id=result.get("message_id")
        )
        
        return {
            "success": True,
            "message": "Message queued successfully",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send message error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Broadcast message endpoint
@router.post("/broadcast")
async def broadcast_message(
    request: BroadcastMessageRequest,
    current_user: User = Depends(require_role(["admin", "staff"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Broadcast message to multiple farmers (admin/staff only).
    
    Allows administrators and staff to send bulk messages to farmers.
    """
    try:
        # Validate phone numbers
        valid_phones = []
        for phone in request.phone_numbers:
            # Check if farmer exists
            result = await db.execute(
                select(Farmer).where(
                    (Farmer.phone == phone) | (Farmer.whatsapp_number == phone)
                )
            )
            farmer = result.scalar_one_or_none()
            
            if farmer:
                valid_phones.append(phone)
        
        if not valid_phones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid farmers found for the provided phone numbers"
            )
        
        # Broadcast message
        result = await whatsapp_service.broadcast_message(
            message=request.message,
            phone_numbers=valid_phones,
            message_type=MessageType(request.message_type),
            priority=request.priority
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to broadcast: {result.get('error')}"
            )
        
        # Log the broadcast
        for phone in valid_phones:
            await log_whatsapp_message(
                db=db,
                phone_number=phone,
                message=request.message,
                message_type=MessageType(request.message_type),
                status=MessageStatus.QUEUED,
                provider_message_id=None
            )
        
        return {
            "success": True,
            "message": f"Broadcast queued for {result['total']} recipients",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Broadcast message error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# View message logs endpoint
@router.get("/logs", response_model=List[MessageLogResponse])
async def get_message_logs(
    phone_number: Optional[str] = None,
    message_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(require_role(["admin", "staff"])),
    db: AsyncSession = Depends(get_db)
):
    """
    View WhatsApp message logs (admin/staff only).
    
    Allows administrators and staff to view message delivery logs.
    """
    try:
        # Build query
        query = select(WhatsappLog)
        
        # Apply filters
        if phone_number:
            query = query.where(WhatsappLog.phone_number == phone_number)
        
        if message_type:
            query = query.where(WhatsappLog.message == message_type)
        
        if status:
            query = query.where(WhatsappLog.status == status)
        
        # Order by created_at descending
        query = query.order_by(WhatsappLog.created_at.desc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        return logs
        
    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Service status endpoint
@router.get("/status", response_model=ServiceStatusResponse)
async def get_service_status(
    current_user: User = Depends(require_role(["admin", "staff"]))
):
    """
    Check WhatsApp service status (admin/staff only).
    
    Returns current queue status and service health.
    """
    try:
        # Get queue status
        queue_status = await whatsapp_service.get_queue_status()
        
        return ServiceStatusResponse(
            status="operational",
            provider=whatsapp_service.provider.__class__.__name__,
            queue_status=queue_status,
            last_check=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Get status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Clear queue endpoint (admin only)
@router.post("/queue/clear")
async def clear_queue(
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Clear message queue (admin only).
    
    Allows administrators to clear the message queue in case of issues.
    """
    try:
        result = await whatsapp_service.clear_queue()
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clear queue error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Helper functions
async def log_whatsapp_message(
    db: AsyncSession,
    phone_number: str,
    message: str,
    message_type: MessageType,
    status: MessageStatus,
    provider_message_id: Optional[str] = None,
    error_message: Optional[str] = None
):
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
