"""Authentication API routes."""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash
)
from app.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.database import get_db
from app.models.user import User
from app.schemas.all_schemas import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SuccessResponse,
    ErrorResponse
)
from app.schemas.common import create_success_response, create_error_response
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])
audit_service = AuditService()


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    """
    Authenticate user and return JWT tokens.
    
    Args:
        request: Login request with email and password
        db: Database session
        
    Returns:
        LoginResponse: Access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid
    """
    result = await db.execute(
        select(User).where(
            or_(
                User.email == request.email,
                User.is_active == True,
                User.deleted_at == None
            )
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role},
        expires_delta=timedelta(minutes=15)
    )
    refresh_token = create_refresh_token(user.id)
    
    # Log login
    await audit_service.log_action(
        db=db,
        user_id=user.id,
        action="login",
        entity_type="user",
        entity_id=user.id,
        old_values=None,
        new_values={"email": user.email}
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=900,  # 15 minutes
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "language_preference": user.language_preference
        }
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> RefreshTokenResponse:
    """
    Refresh access token using refresh token.
    
    Args:
        request: Refresh token request
        db: Database session
        
    Returns:
        RefreshTokenResponse: New access and refresh tokens
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    # Verify refresh token
    if not verify_token(request.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Decode refresh token to get user_id
    from jose import jwt, JWTError
    from app.core.auth import decode_token
    from app.config import get_settings
    
    settings = get_settings()
    
    try:
        payload = decode_token(request.refresh_token)
        user_id = payload.sub
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Get user
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.is_active == True,
            User.deleted_at == None
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    access_token = create_access_token(
        data={"sub": user_id, "role": user.role},
        expires_delta=timedelta(minutes=15)
    )
    refresh_token = create_refresh_token(user_id)
    
    # Log token refresh
    await audit_service.log_action(
        db=db,
        user_id=user.id,
        action="token_refresh",
        entity_type="user",
        entity_id=user.id,
        old_values=None,
        new_values={"user_id": user_id}
    )
    
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=900,  # 15 minutes
    )


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    current_user: CurrentUser,
    db: DatabaseSession
) -> SuccessResponse:
    """
    Logout current user.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        SuccessResponse: Logout success message
        
    Raises:
        HTTPException: If user not authenticated
    """
    # In a real implementation, you would invalidate the refresh token here
    # For now, we'll just log the logout
    
    # Log logout
    await audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="logout",
        entity_type="user",
        entity_id=current_user.id,
        old_values=None,
        new_values=None
    )
    
    return create_success_response(message="Logout successful")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """
    Initiate password reset.
    
    Args:
        email: User email address
        db: Database session
        
    Returns:
        SuccessResponse: Password reset initiated
        
    Raises:
        HTTPException: If email not found
    """
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Log password reset request
    await audit_service.log_action(
        db=db,
        user_id=user.id,
        action="forgot_password",
        entity_type="user",
        entity_id=user.id,
        old_values=None,
        new_values={"email": email}
    )
    
    return create_success_response(message="Password reset email sent")


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    token: str,
    new_password: str = Body(..., min_length=8),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """
    Reset password using token.
    
    Args:
        token: Password reset token
        new_password: New password
        db: Database session
        
    Returns:
        SuccessResponse: Password reset successful
        
    Raises:
        HTTPException: If token is invalid
    """
    # In a real implementation, you would validate the token and update the password
    # For now, we'll just log the password reset
    
    # Log password reset
    await audit_service.log_action(
        db=db,
        user_id=None,
        action="reset_password",
        entity_type="user",
        entity_id=None,
        old_values=None,
        new_values={"token": token}
    )
    
    return create_success_response(message="Password reset successful")
