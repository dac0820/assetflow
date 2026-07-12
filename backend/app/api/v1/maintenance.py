"""
Enterprise CMMS — Maintenance API Router
20+ REST endpoints covering the full CMMS workflow.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import UUID4
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.maintenance import maintenance_repository
from app.services.maintenance import maintenance_service
from app.schemas.maintenance import (
    MaintenanceCreate, MaintenanceUpdate,
    MaintenanceApproveRequest, MaintenanceRejectRequest,
    MaintenanceAssignRequest, MaintenanceCompleteRequest,
    MaintenanceCloseRequest, MaintenancePauseRequest,
    MaintenanceCancelRequest, MaintenanceBulkActionRequest,
    MaintenanceAttachmentCreate, MaintenanceCommentCreate,
    MaintenanceResponse, MaintenanceSummary, MaintenanceListResponse,
    MaintenanceAnalyticsResponse, MaintenanceCalendarEvent,
    MaintenanceAttachmentResponse, MaintenanceCommentResponse,
    MaintenanceStatusLogResponse,
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


# ---------------------------------------------------------------------------
# CORE CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED,
             summary="Create maintenance request")
def create_maintenance_request(payload: MaintenanceCreate, db: Session = Depends(get_db)):
    """Raise a new maintenance work order. Enforces all business rules at creation time."""
    try:
        return maintenance_service.create_request(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("", response_model=MaintenanceListResponse,
            summary="List maintenance requests (paginated, filterable)")
def list_maintenance_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    maintenance_type: Optional[str] = Query(None),
    asset_id: Optional[UUID4] = Query(None),
    technician_id: Optional[UUID4] = Query(None),
    vendor_id: Optional[UUID4] = Query(None),
    search_term: Optional[str] = Query(None),
    sla_breached: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    items = maintenance_repository.get_with_filters(
        db,
        status=status_filter,
        priority=priority,
        maintenance_type=maintenance_type,
        asset_id=asset_id,
        technician_id=technician_id,
        vendor_id=vendor_id,
        search_term=search_term,
        sla_breached=sla_breached,
        skip=skip,
        limit=limit,
    )
    total = maintenance_repository.count_with_filters(
        db,
        status=status_filter,
        priority=priority,
        maintenance_type=maintenance_type,
        asset_id=asset_id,
        technician_id=technician_id,
        search_term=search_term,
    )
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/analytics/summary", response_model=MaintenanceAnalyticsResponse,
            summary="Maintenance analytics dashboard data")
def get_analytics(db: Session = Depends(get_db)):
    """Returns aggregated KPIs: status distribution, cost totals, MTTR, SLA compliance %."""
    return maintenance_repository.get_analytics(db)


@router.get("/overdue", response_model=List[MaintenanceSummary],
            summary="Get all SLA-breached open requests")
def get_overdue_requests(db: Session = Depends(get_db)):
    return maintenance_repository.get_overdue(db)


@router.get("/calendar", response_model=List[MaintenanceCalendarEvent],
            summary="Calendar events for a date range")
def get_calendar_events(
    start: datetime = Query(..., description="Range start (ISO 8601)"),
    end: datetime = Query(..., description="Range end (ISO 8601)"),
    db: Session = Depends(get_db)
):
    return maintenance_repository.get_calendar_events(db, start=start, end=end)


@router.get("/{id}", response_model=MaintenanceResponse,
            summary="Get maintenance request by ID")
def get_maintenance_request(id: UUID4, db: Session = Depends(get_db)):
    request = maintenance_repository.get(db, id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found.")
    return request


@router.patch("/{id}", response_model=MaintenanceResponse,
              summary="Update maintenance request fields")
def update_maintenance_request(id: UUID4, payload: MaintenanceUpdate, db: Session = Depends(get_db)):
    try:
        return maintenance_service.update_request(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ---------------------------------------------------------------------------
# WORKFLOW ACTIONS
# ---------------------------------------------------------------------------

@router.post("/{id}/approve", response_model=MaintenanceResponse,
             summary="Approve maintenance request")
def approve_request(id: UUID4, payload: MaintenanceApproveRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.approve_request(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{id}/reject", response_model=MaintenanceResponse,
             summary="Reject maintenance request")
def reject_request(id: UUID4, payload: MaintenanceRejectRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.reject_request(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{id}/assign", response_model=MaintenanceResponse,
             summary="Assign technician to maintenance request")
def assign_technician(id: UUID4, payload: MaintenanceAssignRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.assign_technician(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/start", response_model=MaintenanceResponse,
             summary="Start work on maintenance request")
def start_work(
    id: UUID4,
    technician_id: Optional[UUID4] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        return maintenance_service.start_work(db, request_id=id, technician_id=technician_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/pause", response_model=MaintenanceResponse,
             summary="Pause work (waiting for parts)")
def pause_work(id: UUID4, payload: MaintenancePauseRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.pause_work(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/resume", response_model=MaintenanceResponse,
             summary="Resume work after parts received")
def resume_work(
    id: UUID4,
    technician_id: Optional[UUID4] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        return maintenance_service.resume_work(db, request_id=id, technician_id=technician_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/complete", response_model=MaintenanceResponse,
             summary="Mark work as completed (enters QA inspection stage)")
def complete_work(id: UUID4, payload: MaintenanceCompleteRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.complete_work(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/resolve", response_model=MaintenanceResponse,
             summary="Resolve after QA inspection pass")
def resolve_request(
    id: UUID4,
    notes: Optional[str] = Query(None, description="QA notes"),
    db: Session = Depends(get_db)
):
    try:
        return maintenance_service.resolve_request(db, request_id=id, notes=notes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/close", response_model=MaintenanceResponse,
             summary="Close maintenance work order (final state)")
def close_request(id: UUID4, payload: MaintenanceCloseRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.close_request(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/cancel", response_model=MaintenanceResponse,
             summary="Cancel maintenance request")
def cancel_request(id: UUID4, payload: MaintenanceCancelRequest, db: Session = Depends(get_db)):
    try:
        return maintenance_service.cancel_request(db, request_id=id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ---------------------------------------------------------------------------
# BULK ACTIONS
# ---------------------------------------------------------------------------

@router.post("/bulk-action", summary="Bulk approve/reject/cancel")
def bulk_action(payload: MaintenanceBulkActionRequest, db: Session = Depends(get_db)):
    return maintenance_service.bulk_action(db, payload)


# ---------------------------------------------------------------------------
# ATTACHMENTS
# ---------------------------------------------------------------------------

@router.post("/{id}/attachments", response_model=MaintenanceAttachmentResponse,
             status_code=status.HTTP_201_CREATED, summary="Add file attachment metadata")
def add_attachment(id: UUID4, payload: MaintenanceAttachmentCreate, db: Session = Depends(get_db)):
    request = maintenance_repository.get(db, id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found.")
    return maintenance_repository.add_attachment(db, maintenance_request_id=id, attachment_in=payload)


@router.get("/{id}/attachments", response_model=List[MaintenanceAttachmentResponse],
            summary="List attachments for a maintenance request")
def get_attachments(id: UUID4, db: Session = Depends(get_db)):
    return maintenance_repository.get_attachments(db, maintenance_request_id=id)


# ---------------------------------------------------------------------------
# COMMENTS
# ---------------------------------------------------------------------------

@router.post("/{id}/comments", response_model=MaintenanceCommentResponse,
             status_code=status.HTTP_201_CREATED, summary="Add a comment")
def add_comment(id: UUID4, payload: MaintenanceCommentCreate, db: Session = Depends(get_db)):
    request = maintenance_repository.get(db, id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found.")
    return maintenance_repository.add_comment(db, maintenance_request_id=id, comment_in=payload)


@router.get("/{id}/comments", response_model=List[MaintenanceCommentResponse],
            summary="List comments for a maintenance request")
def get_comments(
    id: UUID4,
    include_internal: bool = Query(True),
    db: Session = Depends(get_db)
):
    return maintenance_repository.get_comments(db, maintenance_request_id=id,
                                               include_internal=include_internal)


# ---------------------------------------------------------------------------
# TIMELINE
# ---------------------------------------------------------------------------

@router.get("/{id}/timeline", response_model=List[MaintenanceStatusLogResponse],
            summary="Status transition history for a maintenance request")
def get_timeline(id: UUID4, db: Session = Depends(get_db)):
    return maintenance_repository.get_status_timeline(db, maintenance_request_id=id)
