"""Audit service for logging CRUD operations."""

from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_log import SecurityLog


class AuditService:
    """Service for audit logging."""
    
    async def log_action(
        self,
        db: AsyncSession,
        user_id: Optional[str],
        action: str,
        entity_type: str,
        entity_id: Optional[str],
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None
    ) -> SecurityLog:
        """
        Log an action to the security log.
        
        Args:
            db: Database session
            user_id: User ID who performed action
            action: Action performed (create, update, delete, etc.)
            entity_type: Type of entity affected
            entity_id: ID of entity affected
            old_values: Previous values (for updates)
            new_values: New values
            
        Returns:
            SecurityLog: Created security log entry
        """
        log = SecurityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            created_at=datetime.utcnow()
        )
        
        db.add(log)
        await db.commit()
        
        return log
    
    async def log_create(
        self,
        db: AsyncSession,
        user_id: str,
        entity_type: str,
        entity_id: str,
        data: Dict[str, Any]
    ) -> SecurityLog:
        """Log a create action."""
        return await self.log_action(
            db=db,
            user_id=user_id,
            action="create",
            entity_type=entity_type,
            entity_id=entity_id,
            new_values=data
        )
    
    async def log_update(
        self,
        db: AsyncSession,
        user_id: str,
        entity_type: str,
        entity_id: str,
        old_data: Dict[str, Any],
        new_data: Dict[str, Any]
    ) -> SecurityLog:
        """Log an update action."""
        return await self.log_action(
            db=db,
            user_id=user_id,
            action="update",
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_data,
            new_values=new_data
        )
    
    async def log_delete(
        self,
        db: AsyncSession,
        user_id: str,
        entity_type: str,
        entity_id: str,
        data: Optional[Dict[str, Any]] = None
    ) -> SecurityLog:
        """Log a delete action."""
        return await self.log_action(
            db=db,
            user_id=user_id,
            action="delete",
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=data if data else None,
            new_values=None
        )
