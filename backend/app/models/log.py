from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Notification(Base, AuditMixin):
    __tablename__ = "notifications"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(String(512), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    user = relationship("User")

class ActivityLog(Base, AuditMixin):
    __tablename__ = "activity_logs"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    payload = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    user = relationship("User")
