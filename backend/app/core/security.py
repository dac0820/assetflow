import os
from datetime import datetime, timedelta
from typing import Union, Any, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext

# Set up password hashing crypt contexts
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Enforce JWT settings with fallbacks
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "b39afb07223b2075796dfa9c1e19d1e39a0ef22f2b3e8e1df11a2f6479010419")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time comparison validating password hashes
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Bcrypt password hashing function
    """
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], roles: list[str], permissions: list[str], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a short-lived access JWT containing user permissions
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "roles": roles,
        "permissions": permissions,
        "exp": expire,
        "iss": "assetflow_iam"
    }
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a long-lived refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "iss": "assetflow_iam"
    }
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """
    Decodes and validates a JWT token signature
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid credentials or signature verification failed.")
