from datetime import datetime, timedelta
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, Role, UserSession, FailedLoginAttempt, LoginHistory

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900 # 15 minutes

def hash_token(token: str) -> str:
    """
    Utility to hash a token string for safe database lookup
    """
    return hashlib.sha256(token.encode()).hexdigest()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email address already exists."
        )
        
    # Get or create default employee role
    role = db.query(Role).filter(Role.name == "employee").first()
    if not role:
        # Fallback to create role if not exists
        role = Role(name="employee", description="Default employee role")
        db.add(role)
        db.commit()
        db.refresh(role)
        
    # Create user
    new_user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role_id=role.id,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize failed login attempts tracker
    failed_tracker = FailedLoginAttempt(user_id=new_user.id, attempt_count=0)
    db.add(failed_tracker)
    db.commit()
    
    return {"status": "success", "message": "User registered successfully. Please verify your email."}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Check lockout status
    lockout = db.query(FailedLoginAttempt).filter(FailedLoginAttempt.user_id == user.id).first()
    if lockout and lockout.locked_until and lockout.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to consecutive failures. Try again after {lockout.locked_until}."
        )
        
    # Verify password credentials
    if not verify_password(payload.password, user.hashed_password):
        # Increment failed login attempts
        if lockout:
            lockout.attempt_count += 1
            if lockout.attempt_count >= 5:
                lockout.locked_until = datetime.utcnow() + timedelta(minutes=15)
            db.add(lockout)
        
        # Log failure history
        failed_log = LoginHistory(user_id=user.id, ip_address="127.0.0.1", status="failed")
        db.add(failed_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Reset failed attempts on success
    if lockout:
        lockout.attempt_count = 0
        lockout.locked_until = None
        db.add(lockout)
        
    # Log success history
    success_log = LoginHistory(user_id=user.id, ip_address="127.0.0.1", status="success")
    db.add(success_log)
    
    # Generate tokens
    permissions = [p.code for p in user.role.permissions] if user.role else []
    access_token = create_access_token(subject=user.id, roles=[user.role.name], permissions=permissions)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Save session
    session = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()
    
    # Set Secure, HttpOnly cookie
    response.set_cookie(
        key="Refresh_Token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
        max_age=604800 # 7 days
    )
    
    return {"access_token": access_token}

@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, Refresh_Token: str = Cookie(None), db: Session = Depends(get_db)):
    if not Refresh_Token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing."
        )
        
    # Decode token signature
    try:
        payload = decode_token(Refresh_Token)
        user_id = payload.get("sub")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")
        
    # Check session record
    token_hash = hash_token(Refresh_Token)
    session = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()
    
    # Breach Detection: if token is used or revoked
    if not session or session.is_revoked or session.expires_at < datetime.utcnow():
        # Revoke all active sessions for this user ID to prevent unauthorized access
        if user_id:
            db.query(UserSession).filter(UserSession.user_id == user_id).update({"is_revoked": True})
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compromised or expired session. Please log in again."
        )
        
    # Mark old token as revoked/used
    session.is_revoked = True
    db.add(session)
    
    # Issue new tokens
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
        
    permissions = [p.code for p in user.role.permissions] if user.role else []
    new_access_token = create_access_token(subject=user.id, roles=[user.role.name], permissions=permissions)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    # Save new active session
    new_session = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_token(new_refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(new_session)
    db.commit()
    
    # Update cookie with new rotated refresh token
    response.set_cookie(
        key="Refresh_Token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
        max_age=604800
    )
    
    return {"access_token": new_access_token}

@router.post("/logout")
def logout(response: Response, Refresh_Token: str = Cookie(None), db: Session = Depends(get_db)):
    if Refresh_Token:
        token_hash = hash_token(Refresh_Token)
        db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).update({"is_revoked": True})
        db.commit()
        
    # Clear client cookie
    response.delete_cookie(key="Refresh_Token", path="/api/v1/auth")
    return {"status": "success", "message": "Logged out successfully."}
