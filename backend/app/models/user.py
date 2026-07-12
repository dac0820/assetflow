import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Table, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

# Many-to-Many association table for Roles and Permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

class Permission(Base, AuditMixin):
    __tablename__ = "permissions"
    
    code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class Role(Base, AuditMixin):
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class User(Base, AuditMixin):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), nullable=True) # Linked to HR employee profile if exists
    
    is_verified = Column(Boolean, default=False, nullable=False)
    password_changed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    failed_attempts = relationship("FailedLoginAttempt", uselist=False, back_populates="user", cascade="all, delete-orphan")
    resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base, AuditMixin):
    __tablename__ = "user_sessions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash = Column(String(255), unique=True, nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class FailedLoginAttempt(Base, AuditMixin):
    __tablename__ = "failed_login_attempts"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    attempt_count = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="failed_attempts")

class LoginHistory(Base, AuditMixin):
    __tablename__ = "login_history"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(512), nullable=True)
    status = Column(String(20), nullable=False) # 'success', 'failed'
    
    # Relationships
    user = relationship("User", back_populates="login_history")

class Device(Base, AuditMixin):
    __tablename__ = "devices"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String(255), nullable=False)
    last_active_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="devices")

class PasswordReset(Base, AuditMixin):
    __tablename__ = "password_resets"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="resets")

class EmailVerification(Base, AuditMixin):
    __tablename__ = "email_verifications"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="verifications")
