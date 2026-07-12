from sqlalchemy import Column, String, ForeignKey, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class AuditCycle(Base, AuditMixin):
    __tablename__ = "audit_cycles"
    
    title = Column(String(100), nullable=False)
    scheduled_start = Column(Date, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    results = relationship("AuditResult", back_populates="cycle", cascade="all, delete-orphan")

class AuditResult(Base, AuditMixin):
    __tablename__ = "audit_results"
    
    audit_cycle_id = Column(UUID(as_uuid=True), ForeignKey("audit_cycles.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    scanned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    scanned_at = Column(DateTime(timezone=True), nullable=True)
    condition_found = Column(String(50), nullable=True)
    verification_status = Column(String(50), nullable=False, default="pending") # pending, verified, discrepancy
    notes = Column(String(512), nullable=True)
    
    # Relationships
    cycle = relationship("AuditCycle", back_populates="results")
    asset = relationship("Asset", back_populates="audit_results")
    scanned_by = relationship("User")
