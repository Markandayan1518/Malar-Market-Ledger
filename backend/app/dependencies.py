"""Dependency injection for FastAPI routes."""

from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.core.auth import verify_token, decode_token
from app.config import get_settings

settings = get_settings()

# HTTP Bearer scheme for JWT authentication
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP authorization credentials
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id: str = payload.sub
        
        if user_id is None:
            raise credentials_exception
            
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            raise credentials_exception
            
        return user
        
    except Exception as e:
        raise credentials_exception


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current admin user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current admin user
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_role(roles: list[str]):
    """
    Dependency factory that checks if current user has one of the required roles.
    
    Args:
        roles: List of allowed role names
        
    Returns:
        Dependency function that validates user role
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role.value not in roles and current_user.role not in [UserRole(r) for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join(roles)}"
            )
        return current_user
    return role_checker


async def get_current_staff_or_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current staff or admin user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current staff or admin user
        
    Raises:
        HTTPException: If user is not staff or admin
    """
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or admin access required"
        )
    return current_user


def get_pagination_params(
    page: int = 1,
    page_size: int = settings.default_page_size
) -> tuple[int, int]:
    """
    Dependency to get and validate pagination parameters.
    
    Args:
        page: Page number (1-indexed)
        page_size: Items per page
        
    Returns:
        tuple[int, int]: Validated (page, page_size)
        
    Raises:
        HTTPException: If page_size exceeds maximum
    """
    if page < 1:
        page = 1
        
    if page_size < 1:
        page_size = settings.default_page_size
        
    if page_size > settings.max_page_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"page_size cannot exceed {settings.max_page_size}"
        )
        
    return page, page_size


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdminUser = Annotated[User, Depends(get_current_admin_user)]
CurrentStaffOrAdminUser = Annotated[User, Depends(get_current_staff_or_admin_user)]
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
PaginationParams = Annotated[tuple[int, int], Depends(get_pagination_params)]
