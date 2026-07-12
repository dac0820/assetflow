"""
Enterprise CMMS — Maintenance Management Models
Inspired by IBM Maximo, SAP PM, ServiceNow Asset Operations.

Supports: Corrective, Preventive, Emergency, Inspection, Calibration,
          Cleaning, Scheduled, Predictive, Vendor, AMC maintenance types.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, ForeignKey, DateTime, Numeric,
    Boolean, Integer, Text, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin


# ---------------------------------------------------------------------------
# MAINTENANCE TYPE & PRIORITY CONSTANTS
# ---------------------------------------------------------------------------
MAINTENANCE_TYPES = [
    "corrective", "preventive", "emergency", "inspection",
    "calibration", "cleaning", "scheduled", "predictive",
    "vendor", "amc"
]

MAINTENANCE_PRIORITIES = ["critical", "high", "medium", "low"]

MAINTENANCE_STATUSES = [
    "draft", "pending_approval", "approved", "assigned",
    "started", "waiting_parts", "in_progress", "qa_inspection",
    "resolved", "closed", "rejected", "cancelled"
]

# SLA resolution hours by priority
SLA_HOURS = {
    "critical": 4,
    "high": 24,
    "medium": 72,
    "low": 168,
}


class MaintenanceRequest(Base, AuditMixin):
    """
    Core CMMS work order entity.
    Drives the 10-stage maintenance workflow engine.
    """
    __tablename__ = "maintenance_requests"

    # Override the default 'status' from AuditMixin for maintenance workflow
    status = Column(String(50), nullable=False, default="pending_approval")

    # ── CLASSIFICATION ──────────────────────────────────────────────────────
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    maintenance_type = Column(String(50), nullable=False, default="corrective")
    priority = Column(String(20), nullable=False, default="medium")
    category_tag = Column(String(100), nullable=True)  # e.g. "electrical", "mechanical"

    # ── ASSET LINK ──────────────────────────────────────────────────────────
    asset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # ── PEOPLE ──────────────────────────────────────────────────────────────
    requested_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True
    )
    approved_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True
    )
    assigned_technician_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    vendor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vendors.id", ondelete="SET NULL"),
        nullable=True
    )

    # ── SLA & TIMING ────────────────────────────────────────────────────────
    sla_due_at = Column(DateTime(timezone=True), nullable=True, index=True)
    actual_start_at = Column(DateTime(timezone=True), nullable=True)
    actual_end_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)

    # ── DOWNTIME TRACKING ───────────────────────────────────────────────────
    downtime_start = Column(DateTime(timezone=True), nullable=True)
    downtime_end = Column(DateTime(timezone=True), nullable=True)

    # ── COST & LABOR ────────────────────────────────────────────────────────
    estimated_cost = Column(Numeric(15, 2), default=0.00, nullable=False)
    actual_cost = Column(Numeric(15, 2), default=0.00, nullable=False)
    labor_hours = Column(Numeric(8, 2), default=0.00, nullable=False)

    # ── RESOLUTION ──────────────────────────────────────────────────────────
    resolution_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # ── PARTS (JSONB list of {name, quantity, unit_cost, status}) ───────────
    parts_required = Column(JSONB, default=[], nullable=False)

    # ── RECURRING ───────────────────────────────────────────────────────────
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_rule = Column(JSONB, nullable=True)  # {frequency: "monthly", day: 1}
    parent_request_id = Column(UUID(as_uuid=True), nullable=True)  # For generated recurrences

    # ── RELATIONSHIPS ────────────────────────────────────────────────────────
    asset = relationship("Asset", back_populates="maintenance_records")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    technician = relationship("User", foreign_keys=[assigned_technician_id])
    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    attachments = relationship(
        "MaintenanceAttachment",
        back_populates="maintenance_request",
        cascade="all, delete-orphan"
    )
    comments = relationship(
        "MaintenanceComment",
        back_populates="maintenance_request",
        cascade="all, delete-orphan",
        order_by="MaintenanceComment.created_at"
    )
    status_logs = relationship(
        "MaintenanceStatusLog",
        back_populates="maintenance_request",
        cascade="all, delete-orphan",
        order_by="MaintenanceStatusLog.created_at"
    )

    __table_args__ = (
        Index("ix_maintenance_status_priority", "status", "priority"),
        Index("ix_maintenance_asset_status", "asset_id", "status"),
    )


class MaintenanceAttachment(Base, AuditMixin):
    """
    File attachments linked to maintenance requests.
    Stores metadata only (URL, type, size). Binary storage is external.
    """
    __tablename__ = "maintenance_attachments"

    maintenance_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    uploaded_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False)   # photo, video, document, other
    mime_type = Column(String(100), nullable=True)
    file_size_kb = Column(Integer, nullable=True)
    description = Column(String(255), nullable=True)

    # Relationships
    maintenance_request = relationship("MaintenanceRequest", back_populates="attachments")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])


class MaintenanceComment(Base, AuditMixin):
    """
    Threaded comment trail per maintenance request.
    Immutable once created (audit integrity).
    """
    __tablename__ = "maintenance_comments"

    maintenance_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    body = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)  # Internal tech note vs. public

    # Relationships
    maintenance_request = relationship("MaintenanceRequest", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


class MaintenanceStatusLog(Base, AuditMixin):
    """
    Immutable audit trail of every status transition.
    Written once, never updated — core compliance record.
    """
    __tablename__ = "maintenance_status_logs"

    maintenance_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    changed_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    metadata_snapshot = Column(JSONB, default={}, nullable=False)  # Key fields at transition time

    # Relationships
    maintenance_request = relationship("MaintenanceRequest", back_populates="status_logs")
    changed_by = relationship("User", foreign_keys=[changed_by_id])
