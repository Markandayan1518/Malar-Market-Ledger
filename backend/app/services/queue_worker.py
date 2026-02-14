"""Background worker for processing WhatsApp message queue."""

import asyncio
import logging
from contextlib import asynccontextmanager

from app.services.whatsapp_service import whatsapp_service
from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def get_redis_connection():
    """Context manager for Redis connection."""
    from redis import Redis
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield redis
    finally:
        await redis.aclose()


async def process_queue_worker():
    """
    Background worker to process WhatsApp message queue.
    
    This function runs continuously to process messages from the queue.
    It should be started as a separate process or task.
    """
    logger.info("Starting WhatsApp queue worker...")
    
    while True:
        try:
            # Process the queue
            await whatsapp_service.process_queue()
            
        except Exception as e:
            logger.error(f"Error in queue worker: {str(e)}")
            # Wait before retrying
            await asyncio.sleep(5)


async def start_queue_worker():
    """
    Start the queue worker.
    
    This function can be called from FastAPI startup event.
    """
    logger.info("Queue worker started")
    
    # Create background task
    asyncio.create_task(process_queue_worker())


def get_queue_status():
    """
    Get current queue status.
    
    Returns:
        Dictionary with queue statistics
    """
    try:
        return asyncio.run(whatsapp_service.get_queue_status())
    except Exception as e:
        logger.error(f"Error getting queue status: {str(e)}")
        return {"error": str(e)}


def clear_all_queues():
    """
    Clear all message queues.
    
    This is an admin function for troubleshooting.
    """
    try:
        result = asyncio.run(whatsapp_service.clear_queue())
        return result
    except Exception as e:
        logger.error(f"Error clearing queues: {str(e)}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # Run worker directly
    asyncio.run(process_queue_worker())
