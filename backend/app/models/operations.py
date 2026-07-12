from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class AssetAllocation(Base, AuditMixin):
    __tablename__ = "asset_allocations"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    allocated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", back_populates="allocations")

class TransferRequest(Base, AuditMixin):
    __tablename__ = "transfer_requests"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    source_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    target_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    requested_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="transfers")
    source_location = relationship("Location", foreign_keys=[source_location_id])
    target_location = relationship("Location", foreign_keys=[target_location_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class Booking(Base, AuditMixin):
    __tablename__ = "bookings"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="approved", nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="bookings")
    employee = relationship("Employee")

class Maintenance(Base, AuditMixin):
    __tablename__ = "maintenance_requests"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    assigned_technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    cost = Column(Numeric(15, 2), default=0.00, nullable=False)
    notes = Column(String(512), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="maintenance_records")
    technician = relationship("User", foreign_keys=[assigned_technician_id])
