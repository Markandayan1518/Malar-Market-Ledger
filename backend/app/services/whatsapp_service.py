"""WhatsApp service abstraction with provider-agnostic interface."""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum

import httpx
from redis import Redis

from app.config import settings
from app.services.message_templates import (
    Language, MessageType, MessageTemplates, detect_language
)

logger = logging.getLogger(__name__)


class WhatsAppProvider(str, Enum):
    """Supported WhatsApp providers."""
    TWILIO = "twilio"
    INTERAKT = "interakt"


class MessageStatus(str, Enum):
    """Message delivery status."""
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


class WhatsAppProviderInterface(ABC):
    """Abstract base class for WhatsApp providers."""
    
    @abstractmethod
    async def send_message(
        self,
        to_phone: str,
        message: str,
        template_id: Optional[str] = None,
        template_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a WhatsApp message."""
        pass
    
    @abstractmethod
    async def validate_webhook(self, payload: Dict[str, Any], signature: str) -> bool:
        """Validate webhook signature."""
        pass
    
    @abstractmethod
    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Parse webhook payload."""
        pass


class TwilioProvider(WhatsAppProviderInterface):
    """Twilio WhatsApp provider implementation."""
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.base_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}"
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        template_id: Optional[str] = None,
        template_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send message via Twilio API."""
        try:
            url = f"{self.base_url}/Messages.json"
            
            # Prepare payload
            payload = {
                "From": f"whatsapp:{self.from_number}",
                "To": f"whatsapp:{to_phone}",
            }
            
            if template_id and template_params:
                # Use template message
                payload["ContentSid"] = template_id
                payload["ContentVariables"] = json.dumps(template_params)
            else:
                # Use text message
                payload["Body"] = message
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    auth=(self.account_sid, self.auth_token),
                    data=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                data = response.json()
                return {
                    "success": True,
                    "message_id": data.get("sid"),
                    "status": MessageStatus.QUEUED,
                    "provider": WhatsAppProvider.TWILIO
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Twilio API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": str(e),
                "provider": WhatsAppProvider.TWILIO
            }
        except Exception as e:
            logger.error(f"Twilio send error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": WhatsAppProvider.TWILIO
            }
    
    async def validate_webhook(self, payload: Dict[str, Any], signature: str) -> bool:
        """Validate Twilio webhook signature."""
        # Note: Twilio signature validation requires the X-Twilio-Signature header
        # This is a simplified version - production should use proper validation
        return True
    
    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Twilio webhook payload."""
        return {
            "phone_number": payload.get("From", "").replace("whatsapp:", ""),
            "message": payload.get("Body", "").strip(),
            "message_id": payload.get("MessageSid"),
            "timestamp": datetime.utcnow(),
            "provider": WhatsAppProvider.TWILIO
        }


class InteraktProvider(WhatsAppProviderInterface):
    """Interakt WhatsApp provider implementation."""
    
    def __init__(self, api_key: str, phone_number_id: str):
        self.api_key = api_key
        self.phone_number_id = phone_number_id
        self.base_url = "https://api.interakt.ai/v1"
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        template_id: Optional[str] = None,
        template_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send message via Interakt API."""
        try:
            url = f"{self.base_url}/message/send"
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Prepare payload
            payload = {
                "phoneNumber": to_phone,
                "type": "text" if not template_id else "template",
            }
            
            if template_id and template_params:
                payload["template"] = {
                    "name": template_id,
                    "languageCode": "en",
                    "headerValues": template_params.get("header", []),
                    "bodyValues": template_params.get("body", [])
                }
            else:
                payload["text"] = message
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                data = response.json()
                return {
                    "success": True,
                    "message_id": data.get("messageId"),
                    "status": MessageStatus.QUEUED,
                    "provider": WhatsAppProvider.INTERAKT
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Interakt API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": str(e),
                "provider": WhatsAppProvider.INTERAKT
            }
        except Exception as e:
            logger.error(f"Interakt send error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": WhatsAppProvider.INTERAKT
            }
    
    async def validate_webhook(self, payload: Dict[str, Any], signature: str) -> bool:
        """Validate Interakt webhook signature."""
        # Note: Implement proper signature validation for production
        return True
    
    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Interakt webhook payload."""
        return {
            "phone_number": payload.get("phoneNumber", ""),
            "message": payload.get("message", {}).get("text", {}).get("body", "").strip(),
            "message_id": payload.get("messageId"),
            "timestamp": datetime.utcnow(),
            "provider": WhatsAppProvider.INTERAKT
        }


class WhatsAppService:
    """
    WhatsApp service with provider-agnostic interface.
    
    Handles message sending, queueing, and delivery tracking.
    """
    
    def __init__(self):
        self.provider = self._get_provider()
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_key = "whatsapp:message_queue"
        self.high_priority_queue = "whatsapp:high_priority_queue"
        self.retry_queue = "whatsapp:retry_queue"
        self.max_retries = 3
        self.retry_delay = 60  # seconds
    
    def _get_provider(self) -> WhatsAppProviderInterface:
        """Get configured WhatsApp provider."""
        provider_type = settings.whatsapp_provider.lower()
        
        if provider_type == WhatsAppProvider.TWILIO:
            return TwilioProvider(
                account_sid=settings.whatsapp_api_key,
                auth_token=settings.whatsapp_api_secret,
                from_number=settings.whatsapp_from_number
            )
        elif provider_type == WhatsAppProvider.INTERAKT:
            return InteraktProvider(
                api_key=settings.whatsapp_api_key,
                phone_number_id=settings.whatsapp_phone_number
            )
        else:
            raise ValueError(f"Unsupported WhatsApp provider: {provider_type}")
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        message_type: MessageType,
        template_id: Optional[str] = None,
        template_params: Optional[Dict[str, Any]] = None,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Send WhatsApp message with queueing.
        
        Args:
            to_phone: Recipient phone number
            message: Message content
            message_type: Type of message
            template_id: Optional template ID
            template_params: Optional template parameters
            priority: Message priority (high, normal)
            
        Returns:
            Result dict with success status and message_id
        """
        try:
            # Determine queue based on priority
            queue = self.high_priority_queue if priority == "high" else self.queue_key
            
            # Create message payload
            message_data = {
                "to_phone": to_phone,
                "message": message,
                "message_type": message_type.value,
                "template_id": template_id,
                "template_params": template_params,
                "priority": priority,
                "created_at": datetime.utcnow().isoformat(),
                "retry_count": 0
            }
            
            # Add to Redis queue
            await self._enqueue_message(queue, message_data)
            
            logger.info(f"Message queued for {to_phone}, type: {message_type.value}, priority: {priority}")
            
            return {
                "success": True,
                "queued": True,
                "message_type": message_type.value,
                "priority": priority
            }
            
        except Exception as e:
            logger.error(f"Error queueing message: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "queued": False
            }
    
    async def _enqueue_message(self, queue: str, message_data: Dict[str, Any]) -> None:
        """Enqueue message to Redis."""
        message_json = json.dumps(message_data)
        await self.redis.lpush(queue, message_json)
    
    async def dequeue_message(self) -> Optional[Dict[str, Any]]:
        """Dequeue next message from queue."""
        # Check high priority queue first
        message_json = await self.redis.rpop(self.high_priority_queue)
        
        if not message_json:
            # Check normal queue
            message_json = await self.redis.rpop(self.queue_key)
        
        if message_json:
            return json.loads(message_json)
        
        return None
    
    async def process_queue(self) -> None:
        """Process message queue (background worker)."""
        while True:
            try:
                message_data = await self.dequeue_message()
                
                if not message_data:
                    # No messages, wait before checking again
                    await asyncio.sleep(1)
                    continue
                
                # Send message
                result = await self._send_to_provider(message_data)
                
                if not result.get("success"):
                    # Retry logic
                    retry_count = message_data.get("retry_count", 0)
                    if retry_count < self.max_retries:
                        message_data["retry_count"] = retry_count + 1
                        await self._enqueue_message(self.retry_queue, message_data)
                        logger.warning(f"Message retry {retry_count + 1}/{self.max_retries} for {message_data['to_phone']}")
                        await asyncio.sleep(self.retry_delay)
                    else:
                        logger.error(f"Message failed after {self.max_retries} retries for {message_data['to_phone']}")
                
            except Exception as e:
                logger.error(f"Error processing queue: {str(e)}")
                await asyncio.sleep(5)
    
    async def _send_to_provider(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send message to provider."""
        try:
            result = await self.provider.send_message(
                to_phone=message_data["to_phone"],
                message=message_data["message"],
                template_id=message_data.get("template_id"),
                template_params=message_data.get("template_params")
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending to provider: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(self, payload: Dict[str, Any], signature: str) -> Dict[str, Any]:
        """
        Handle incoming webhook from WhatsApp provider.
        
        Args:
            payload: Webhook payload
            signature: Webhook signature for validation
            
        Returns:
            Parsed webhook data
        """
        try:
            # Validate webhook
            if not await self.provider.validate_webhook(payload, signature):
                logger.warning("Invalid webhook signature")
                return {
                    "success": False,
                    "error": "Invalid signature"
                }
            
            # Parse webhook
            webhook_data = self.provider.parse_webhook(payload)
            
            logger.info(f"Webhook received from {webhook_data['phone_number']}")
            
            return {
                "success": True,
                "data": webhook_data
            }
            
        except Exception as e:
            logger.error(f"Error handling webhook: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def broadcast_message(
        self,
        message: str,
        phone_numbers: List[str],
        message_type: MessageType,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Broadcast message to multiple phone numbers.
        
        Args:
            message: Message content
            phone_numbers: List of recipient phone numbers
            message_type: Type of message
            priority: Message priority
            
        Returns:
            Result dict with success status and count
        """
        try:
            success_count = 0
            failed_count = 0
            
            for phone in phone_numbers:
                result = await self.send_message(
                    to_phone=phone,
                    message=message,
                    message_type=message_type,
                    priority=priority
                )
                
                if result.get("success"):
                    success_count += 1
                else:
                    failed_count += 1
            
            logger.info(f"Broadcast completed: {success_count} success, {failed_count} failed")
            
            return {
                "success": True,
                "total": len(phone_numbers),
                "success_count": success_count,
                "failed_count": failed_count
            }
            
        except Exception as e:
            logger.error(f"Error broadcasting message: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status."""
        try:
            high_priority_count = await self.redis.llen(self.high_priority_queue)
            normal_count = await self.redis.llen(self.queue_key)
            retry_count = await self.redis.llen(self.retry_queue)
            
            return {
                "high_priority": high_priority_count,
                "normal": normal_count,
                "retry": retry_count,
                "total": high_priority_count + normal_count + retry_count
            }
            
        except Exception as e:
            logger.error(f"Error getting queue status: {str(e)}")
            return {
                "error": str(e)
            }
    
    async def clear_queue(self) -> Dict[str, Any]:
        """Clear all queues (for testing/admin)."""
        try:
            await self.redis.delete(self.high_priority_queue)
            await self.redis.delete(self.queue_key)
            await self.redis.delete(self.retry_queue)
            
            return {
                "success": True,
                "message": "All queues cleared"
            }
            
        except Exception as e:
            logger.error(f"Error clearing queues: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Global service instance
whatsapp_service = WhatsAppService()
