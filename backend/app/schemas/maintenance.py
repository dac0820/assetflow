"""
Enterprise CMMS — Maintenance Pydantic Schemas
Full request/response models for the 10-stage workflow engine.
"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, UUID4, field_validator, model_validator


# ---------------------------------------------------------------------------
# ENUMS AS LITERAL STRINGS (no Enum class needed — kept as plain constants)
# ---------------------------------------------------------------------------
VALID_TYPES = [
    "corrective", "preventive", "emergency", "inspection",
    "calibration", "cleaning", "scheduled", "predictive", "vendor", "amc"
]
VALID_PRIORITIES = ["critical", "high", "medium", "low"]
VALID_STATUSES = [
    "draft", "pending_approval", "approved", "assigned",
    "started", "waiting_parts", "in_progress", "qa_inspection",
    "resolved", "closed", "rejected", "cancelled"
]


# ---------------------------------------------------------------------------
# PART SCHEMA (JSONB embedded)
# ---------------------------------------------------------------------------
class PartItem(BaseModel):
    name: str = Field(..., max_length=200)
    quantity: int = Field(default=1, ge=1)
    unit_cost: float = Field(default=0.0, ge=0)
    status: str = Field(default="required")   # required / ordered / received


# ---------------------------------------------------------------------------
# RECURRENCE RULE SCHEMA (JSONB embedded)
# ---------------------------------------------------------------------------
class RecurrenceRule(BaseModel):
    frequency: str = Field(..., description="daily | weekly | monthly | yearly")
    interval: int = Field(default=1, ge=1)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    day_of_week: Optional[int] = Field(None, ge=0, le=6)


# ---------------------------------------------------------------------------
# CREATE / UPDATE SCHEMAS
# ---------------------------------------------------------------------------
class MaintenanceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    asset_id: UUID4
    maintenance_type: str = Field(default="corrective")
    priority: str = Field(default="medium")
    category_tag: Optional[str] = Field(None, max_length=100)
    estimated_cost: float = Field(default=0.0, ge=0)
    scheduled_date: Optional[datetime] = None
    vendor_id: Optional[UUID4] = None
    parts_required: Optional[List[PartItem]] = []
    is_recurring: bool = False
    recurrence_rule: Optional[RecurrenceRule] = None
    requested_by_id: Optional[UUID4] = None

    @field_validator("maintenance_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_TYPES:
            raise ValueError(f"Invalid maintenance_type. Must be one of: {VALID_TYPES}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Must be one of: {VALID_PRIORITIES}")
        return v

    @model_validator(mode="after")
    def validate_emergency_priority(self) -> "MaintenanceCreate":
        if self.maintenance_type == "emergency":
            self.priority = "critical"
        if self.maintenance_type == "vendor" and not self.vendor_id:
            raise ValueError("Vendor-type maintenance requires vendor_id.")
        return self


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    category_tag: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    scheduled_date: Optional[datetime] = None
    vendor_id: Optional[UUID4] = None
    parts_required: Optional[List[PartItem]] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[RecurrenceRule] = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Must be one of: {VALID_PRIORITIES}")
        return v


# ---------------------------------------------------------------------------
# WORKFLOW ACTION SCHEMAS
# ---------------------------------------------------------------------------
class MaintenanceApproveRequest(BaseModel):
    approved_by_id: Optional[UUID4] = None
    notes: Optional[str] = None


class MaintenanceRejectRequest(BaseModel):
    rejected_by_id: Optional[UUID4] = None
    rejection_reason: str = Field(..., min_length=5, max_length=1000)


class MaintenanceAssignRequest(BaseModel):
    technician_id: UUID4
    notes: Optional[str] = None


class MaintenanceCompleteRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=10, max_length=5000,
                                   description="Resolution notes are mandatory before closing.")
    actual_cost: Optional[float] = Field(None, ge=0)
    labor_hours: Optional[float] = Field(None, ge=0)


class MaintenanceCloseRequest(BaseModel):
    closed_by_id: Optional[UUID4] = None
    final_notes: Optional[str] = None


class MaintenancePauseRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class MaintenanceCancelRequest(BaseModel):
    cancellation_reason: str = Field(..., min_length=5, max_length=1000)


class MaintenanceBulkActionRequest(BaseModel):
    maintenance_ids: List[UUID4]
    action: str  # "approve", "reject", "cancel"
    reason: Optional[str] = None


# ---------------------------------------------------------------------------
# ATTACHMENT SCHEMA
# ---------------------------------------------------------------------------
class MaintenanceAttachmentCreate(BaseModel):
    file_name: str = Field(..., max_length=255)
    file_url: str = Field(..., max_length=512)
    file_type: str = Field(..., description="photo | video | document | other")
    mime_type: Optional[str] = None
    file_size_kb: Optional[int] = None
    description: Optional[str] = Field(None, max_length=255)
    uploaded_by_id: Optional[UUID4] = None


class MaintenanceAttachmentResponse(BaseModel):
    id: UUID4
    file_name: str
    file_url: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_kb: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# COMMENT SCHEMA
# ---------------------------------------------------------------------------
class MaintenanceCommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    is_internal: bool = False
    author_id: Optional[UUID4] = None


class MaintenanceCommentResponse(BaseModel):
    id: UUID4
    body: str
    is_internal: bool
    author_id: Optional[UUID4] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# STATUS LOG SCHEMA
# ---------------------------------------------------------------------------
class MaintenanceStatusLogResponse(BaseModel):
    id: UUID4
    from_status: Optional[str] = None
    to_status: str
    reason: Optional[str] = None
    changed_by_id: Optional[UUID4] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# RESPONSE SCHEMAS
# ---------------------------------------------------------------------------
class MaintenanceSummary(BaseModel):
    """Lightweight response for list views / Kanban cards."""
    id: UUID4
    title: str
    maintenance_type: str
    priority: str
    status: str
    asset_id: UUID4
    assigned_technician_id: Optional[UUID4] = None
    estimated_cost: float
    actual_cost: float
    sla_due_at: Optional[datetime] = None
    actual_start_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class MaintenanceResponse(MaintenanceSummary):
    """Full detail response including all nested data."""
    description: Optional[str] = None
    category_tag: Optional[str] = None
    requested_by_id: Optional[UUID4] = None
    approved_by_id: Optional[UUID4] = None
    vendor_id: Optional[UUID4] = None
    scheduled_date: Optional[datetime] = None
    actual_end_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    downtime_start: Optional[datetime] = None
    downtime_end: Optional[datetime] = None
    labor_hours: float
    resolution_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    parts_required: List[Dict[str, Any]] = []
    is_recurring: bool
    recurrence_rule: Optional[Dict[str, Any]] = None
    version_number: int
    attachments: List[MaintenanceAttachmentResponse] = []
    comments: List[MaintenanceCommentResponse] = []
    status_logs: List[MaintenanceStatusLogResponse] = []

    class Config:
        from_attributes = True


class MaintenanceListResponse(BaseModel):
    items: List[MaintenanceSummary]
    total: int
    skip: int
    limit: int


# ---------------------------------------------------------------------------
# ANALYTICS SCHEMA
# ---------------------------------------------------------------------------
class MaintenanceAnalyticsResponse(BaseModel):
    total_requests: int
    by_status: Dict[str, int]
    by_type: Dict[str, int]
    by_priority: Dict[str, int]
    avg_resolution_hours: Optional[float] = None
    sla_compliance_pct: Optional[float] = None
    total_actual_cost: float
    total_estimated_cost: float
    total_labor_hours: float
    open_requests: int
    overdue_count: int


# ---------------------------------------------------------------------------
# CALENDAR EVENT SCHEMA
# ---------------------------------------------------------------------------
class MaintenanceCalendarEvent(BaseModel):
    id: UUID4
    title: str
    start: datetime
    maintenance_type: str
    priority: str
    status: str
    asset_id: UUID4

    class Config:
        from_attributes = True
