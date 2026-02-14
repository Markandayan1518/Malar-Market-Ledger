"""Caching service for report generation."""

import hashlib
import json
import logging
from typing import Optional, Any
from datetime import datetime, timedelta

import redis.asyncio as redis
from redis.asyncio import ConnectionPool

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching generated reports."""
    
    def __init__(self):
        """Initialize cache service."""
        self.redis_url = settings.redis_url
        self.pool: Optional[ConnectionPool] = None
        self.cache_ttl = 3600  # 1 hour in seconds
        self._initialized = False
    
    async def _get_redis(self):
        """
        Get Redis connection.
        
        Returns:
            Redis client
        """
        if not self._initialized:
            self.pool = ConnectionPool.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            self._initialized = True
            logger.info("Cache service initialized")
        
        return redis.Redis(connection_pool=self.pool)
    
    def _generate_cache_key(
        self,
        report_type: str,
        **kwargs
    ) -> str:
        """
        Generate cache key from parameters.
        
        Args:
            report_type: Type of report
            **kwargs: Report parameters
            
        Returns:
            Cache key
        """
        # Create a deterministic string from parameters
        params_str = json.dumps(kwargs, sort_keys=True)
        hash_obj = hashlib.md5(params_str.encode())
        hash_hex = hash_obj.hexdigest()
        
        return f"report:{report_type}:{hash_hex}"
    
    async def get(
        self,
        report_type: str,
        **kwargs
    ) -> Optional[bytes]:
        """
        Get cached report.
        
        Args:
            report_type: Type of report
            **kwargs: Report parameters
            
        Returns:
            Cached report bytes or None
        """
        try:
            client = await self._get_redis()
            cache_key = self._generate_cache_key(report_type, **kwargs)
            
            cached_data = await client.get(cache_key)
            
            if cached_data:
                logger.info(f"Cache hit for {cache_key}")
                return cached_data.encode('utf-8') if isinstance(cached_data, str) else cached_data
            
            logger.debug(f"Cache miss for {cache_key}")
            return None
        
        except Exception as e:
            logger.warning(f"Error getting from cache: {e}")
            return None
    
    async def set(
        self,
        report_type: str,
        data: bytes,
        ttl: Optional[int] = None,
        **kwargs
    ) -> bool:
        """
        Cache report data.
        
        Args:
            report_type: Type of report
            data: Report data bytes
            ttl: Time to live in seconds (default: 1 hour)
            **kwargs: Report parameters
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_redis()
            cache_key = self._generate_cache_key(report_type, **kwargs)
            
            if ttl is None:
                ttl = self.cache_ttl
            
            await client.setex(cache_key, ttl, data)
            logger.info(f"Cached report {cache_key} with TTL {ttl}s")
            return True
        
        except Exception as e:
            logger.warning(f"Error setting cache: {e}")
            return False
    
    async def delete(
        self,
        report_type: str,
        **kwargs
    ) -> bool:
        """
        Delete cached report.
        
        Args:
            report_type: Type of report
            **kwargs: Report parameters
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_redis()
            cache_key = self._generate_cache_key(report_type, **kwargs)
            
            await client.delete(cache_key)
            logger.info(f"Deleted cache for {cache_key}")
            return True
        
        except Exception as e:
            logger.warning(f"Error deleting cache: {e}")
            return False
    
    async def invalidate_pattern(
        self,
        pattern: str
    ) -> int:
        """
        Invalidate all caches matching a pattern.
        
        Args:
            pattern: Cache key pattern (e.g., "report:farmer_statement:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            client = await self._get_redis()
            
            keys = await client.keys(pattern)
            if keys:
                deleted = await client.delete(*keys)
                logger.info(f"Invalidated {deleted} caches matching pattern {pattern}")
                return deleted
            
            return 0
        
        except Exception as e:
            logger.warning(f"Error invalidating cache pattern: {e}")
            return 0
    
    async def invalidate_farmer_cache(self, farmer_id: str) -> int:
        """
        Invalidate all caches for a specific farmer.
        
        Args:
            farmer_id: Farmer ID
            
        Returns:
            Number of keys deleted
        """
        return await self.invalidate_pattern(f"report:*:*:{farmer_id}:*")
    
    async def invalidate_month_cache(self, month: int, year: int) -> int:
        """
        Invalidate all caches for a specific month.
        
        Args:
            month: Month (1-12)
            year: Year
            
        Returns:
            Number of keys deleted
        """
        return await self.invalidate_pattern(f"report:*:{month}:{year}:*")
    
    async def invalidate_date_cache(self, date_str: str) -> int:
        """
        Invalidate all caches for a specific date.
        
        Args:
            date_str: Date string in YYYY-MM-DD format
            
        Returns:
            Number of keys deleted
        """
        return await self.invalidate_pattern(f"report:*:{date_str}:*")
    
    async def clear_all(self) -> int:
        """
        Clear all report caches.
        
        Returns:
            Number of keys deleted
        """
        return await self.invalidate_pattern("report:*")
    
    async def get_stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        try:
            client = await self._get_redis()
            
            # Get all report cache keys
            keys = await client.keys("report:*")
            
            # Get memory usage
            info = await client.info("memory")
            used_memory = info.get("used_memory_human", "N/A")
            
            return {
                "total_keys": len(keys),
                "used_memory": used_memory,
                "cache_ttl": self.cache_ttl
            }
        
        except Exception as e:
            logger.warning(f"Error getting cache stats: {e}")
            return {
                "total_keys": 0,
                "used_memory": "N/A",
                "cache_ttl": self.cache_ttl
            }


# Global cache service instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """
    Get or create the global cache service instance.
    
    Returns:
        CacheService instance
    """
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


async def init_cache():
    """Initialize cache service."""
    cache_service = get_cache_service()
    # Trigger initialization
    await cache_service._get_redis()
    logger.info("Cache service initialized successfully")


async def close_cache():
    """Close cache service connections."""
    global _cache_service
    if _cache_service is not None and _cache_service.pool is not None:
        await _cache_service.pool.disconnect()
        logger.info("Cache service closed")
