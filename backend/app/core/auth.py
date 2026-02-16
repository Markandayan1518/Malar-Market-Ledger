"""JWT authentication and password hashing utilities."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

from app.config import get_settings

settings = get_settings()


class TokenData(BaseModel):
    """Token data structure."""
    sub: str  # user_id
    role: Optional[str] = None
    exp: Optional[float] = None


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        bool: True if password matches
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data (user_id, role, etc.)
        expires_delta: Token expiration time (default: 15 minutes)
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def create_refresh_token(user_id: str) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        user_id: User ID
        
    Returns:
        str: Encoded refresh token
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def verify_token(token: str) -> bool:
    """
    Verify a JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        bool: True if token is valid
    """
    try:
        jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return True
    except JWTError:
        return False


def decode_token(token: str) -> TokenData:
    """
    Decode a JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        TokenData: Decoded token data
        
    Raises:
        JWTError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        role: Optional[str] = payload.get("role")
        exp: Optional[float] = payload.get("exp")
        
        if user_id is None:
            raise JWTError("Invalid token")
            
        return TokenData(sub=user_id, role=role, exp=exp)
        
    except JWTError as e:
        raise JWTError(f"Could not validate credentials: {str(e)}")
