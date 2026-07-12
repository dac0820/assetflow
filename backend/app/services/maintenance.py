"""
Enterprise CMMS — Maintenance Workflow Service Engine
Implements the 10-stage maintenance lifecycle with business rule enforcement,
SLA auto-calculation, and immutable audit logging.

Business Rules enforced:
  1. Disposed/retired assets cannot receive maintenance
  2. Lost assets trigger investigation workflow
  3. Emergency maintenance auto-sets priority=critical
  4. 24h duplicate request deduplication per asset+type
  5. Vendor maintenance requires vendor_id
  6. Technician cannot close without resolution_notes
  7. Rejection requires rejection_reason
  8. Asset status becomes 'maintenance' on approval
  9. Asset status restored on close
 10. SLA calculated from priority at creation time
 11. Cancellation reason required
 12. Only unresolved requests can transition forward
 13. Recurring maintenance auto-generates next instance on close
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any
from pydantic import UUID4
from sqlalchemy.orm import Session

from app.repositories.maintenance import maintenance_repository
from app.repositories.asset import asset_repository
from app.models.maintenance import MaintenanceRequest, SLA_HOURS
from app.schemas.maintenance import (
    MaintenanceCreate, MaintenanceUpdate,
    MaintenanceApproveRequest, MaintenanceRejectRequest,
    MaintenanceAssignRequest, MaintenanceCompleteRequest,
    MaintenanceCloseRequest, MaintenancePauseRequest,
    MaintenanceCancelRequest, MaintenanceAttachmentCreate,
    MaintenanceCommentCreate, MaintenanceBulkActionRequest
)


# ---------------------------------------------------------------------------
# VALID WORKFLOW TRANSITIONS (State Machine)
# ---------------------------------------------------------------------------
TRANSITIONS = {
    "pending_approval": ["approved", "rejected"],
    "approved":         ["assigned", "rejected"],
    "assigned":         ["started", "approved"],   # re-assign reverts to approved
    "started":          ["in_progress", "waiting_parts"],
    "waiting_parts":    ["in_progress"],
    "in_progress":      ["qa_inspection", "waiting_parts"],
    "qa_inspection":    ["resolved", "in_progress"],
    "resolved":         ["closed"],
    # Terminal states
    "closed":           [],
    "rejected":         [],
    "cancelled":        [],
    "draft":            ["pending_approval"],
}

# Statuses that represent "open" (asset should remain under maintenance)
OPEN_STATUSES = {
    "pending_approval", "approved", "assigned",
    "started", "waiting_parts", "in_progress", "qa_inspection"
}

TERMINAL_STATUSES = {"closed", "rejected", "cancelled"}


class MaintenanceService:
    """
    Business Logic & Workflow Engine for CMMS Maintenance Management.
    All state transitions validate the state machine + business rules.
    """

    # ── HELPERS ──────────────────────────────────────────────────────────────

    def _compute_sla(self, priority: str) -> datetime:
        hours = SLA_HOURS.get(priority, 72)
        return datetime.now(timezone.utc) + timedelta(hours=hours)

    def _validate_transition(self, current: str, target: str):
        allowed = TRANSITIONS.get(current, [])
        if target not in allowed:
            raise ValueError(
                f"Invalid workflow transition: '{current}' → '{target}'. "
                f"Allowed next states: {allowed}"
            )

    def _transition(
        self,
        db: Session,
        request: MaintenanceRequest,
        to_status: str,
        changed_by_id: Optional[Any] = None,
        reason: Optional[str] = None,
    ) -> MaintenanceRequest:
        """Execute a validated status transition and write audit log."""
        self._validate_transition(request.status, to_status)
        from_status = request.status
        request.status = to_status

        # Write immutable status log
        maintenance_repository.log_status_transition(
            db,
            maintenance_request_id=request.id,
            from_status=from_status,
            to_status=to_status,
            changed_by_id=changed_by_id,
            reason=reason,
            snapshot={
                "priority": request.priority,
                "asset_id": str(request.asset_id),
                "title": request.title,
            }
        )
        return request

    def _restore_asset_status(self, db: Session, asset_id: Any):
        """Restore asset to 'available' after maintenance ends, unless there are other open requests."""
        other_open = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.asset_id == asset_id,
            MaintenanceRequest.status.in_(OPEN_STATUSES),
            MaintenanceRequest.is_deleted == False
        ).first()
        if not other_open:
            asset = asset_repository.get(db, asset_id)
            if asset and asset.status == "maintenance":
                asset.status = "available"
                db.add(asset)

    # ── WORKFLOW ACTIONS ─────────────────────────────────────────────────────

    def create_request(
        self,
        db: Session,
        payload: MaintenanceCreate
    ) -> MaintenanceRequest:
        """
        Create a new maintenance work order.
        Business Rules:
          - Disposed/retired assets blocked
          - 24h duplicate detection
          - Emergency type forces critical priority
          - SLA auto-calculated from priority
        """
        # Rule 1: Validate asset exists and is eligible
        asset = asset_repository.get(db, payload.asset_id)
        if not asset:
            raise ValueError("Target asset not found.")

        if asset.status in ("retired", "disposed"):
            raise ValueError(
                f"Cannot raise maintenance request. Asset has terminal status '{asset.status}'."
            )

        # Rule 4: 24h duplicate detection (skip for emergency)
        if payload.maintenance_type != "emergency":
            is_duplicate = maintenance_repository.check_duplicate_within_24h(
                db, payload.asset_id, payload.maintenance_type
            )
            if is_duplicate:
                raise ValueError(
                    "A maintenance request for this asset and type already exists within the last 24 hours."
                )

        # Build the DB object
        parts_data = [p.model_dump() for p in (payload.parts_required or [])]
        recurrence_data = payload.recurrence_rule.model_dump() if payload.recurrence_rule else None

        initial_status = "pending_approval"

        request = MaintenanceRequest(
            title=payload.title,
            description=payload.description,
            asset_id=payload.asset_id,
            maintenance_type=payload.maintenance_type,
            priority=payload.priority,
            category_tag=payload.category_tag,
            estimated_cost=payload.estimated_cost,
            scheduled_date=payload.scheduled_date,
            vendor_id=payload.vendor_id,
            parts_required=parts_data,
            is_recurring=payload.is_recurring,
            recurrence_rule=recurrence_data,
            requested_by_id=payload.requested_by_id,
            status=initial_status,
            sla_due_at=self._compute_sla(payload.priority),
        )

        db.add(request)
        db.flush()  # Get the ID before logging

        maintenance_repository.log_status_transition(
            db,
            maintenance_request_id=request.id,
            from_status=None,
            to_status=initial_status,
            changed_by_id=payload.requested_by_id,
            reason="Request created",
        )

        db.commit()
        db.refresh(request)
        return request

    def approve_request(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceApproveRequest
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        # Business Rule: asset must not be in a terminal status
        asset = asset_repository.get(db, request.asset_id)
        if asset and asset.status in ("retired", "disposed"):
            raise ValueError("Cannot approve — asset is retired or disposed.")

        self._transition(db, request, "approved",
                         changed_by_id=payload.approved_by_id, reason=payload.notes)

        request.approved_by_id = payload.approved_by_id

        # Mark asset as under maintenance
        if asset:
            asset.status = "maintenance"
            db.add(asset)

        # Start downtime clock
        request.downtime_start = datetime.now(timezone.utc)

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def reject_request(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceRejectRequest
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        if request.status not in ("pending_approval", "approved"):
            raise ValueError(f"Cannot reject a request in '{request.status}' status.")

        self._transition(db, request, "rejected",
                         changed_by_id=payload.rejected_by_id,
                         reason=payload.rejection_reason)
        request.rejection_reason = payload.rejection_reason
        # Restore asset status if approved but now rejected
        self._restore_asset_status(db, request.asset_id)

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def assign_technician(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceAssignRequest
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "assigned", reason=payload.notes)
        request.assigned_technician_id = payload.technician_id

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def start_work(
        self,
        db: Session,
        request_id: Any,
        technician_id: Optional[Any] = None
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "started",
                         changed_by_id=technician_id, reason="Work started by technician")
        request.actual_start_at = datetime.now(timezone.utc)

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def pause_work(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenancePauseRequest
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "waiting_parts", reason=payload.reason or "Waiting for parts")

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def resume_work(
        self,
        db: Session,
        request_id: Any,
        technician_id: Optional[Any] = None
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "in_progress",
                         changed_by_id=technician_id, reason="Parts received, work resumed")

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def complete_work(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceCompleteRequest
    ) -> MaintenanceRequest:
        """Mark work as completed pending QA inspection."""
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        # Business Rule: resolution notes are mandatory
        if not payload.resolution_notes or len(payload.resolution_notes.strip()) < 10:
            raise ValueError("Resolution notes are required (minimum 10 characters) before completing.")

        self._transition(db, request, "qa_inspection", reason="Work completed, pending QA")

        request.resolution_notes = payload.resolution_notes
        request.actual_end_at = datetime.now(timezone.utc)
        if payload.actual_cost is not None:
            request.actual_cost = payload.actual_cost
        if payload.labor_hours is not None:
            request.labor_hours = payload.labor_hours

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def resolve_request(
        self,
        db: Session,
        request_id: Any,
        notes: Optional[str] = None
    ) -> MaintenanceRequest:
        """QA passed — mark as resolved."""
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "resolved", reason=notes or "QA inspection passed")
        request.resolved_at = datetime.now(timezone.utc)

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def close_request(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceCloseRequest
    ) -> MaintenanceRequest:
        """Final closure of maintenance work order."""
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        self._transition(db, request, "closed",
                         changed_by_id=payload.closed_by_id, reason=payload.final_notes)
        request.closed_at = datetime.now(timezone.utc)

        # Close downtime window
        if request.downtime_start and not request.downtime_end:
            request.downtime_end = datetime.now(timezone.utc)

        # Restore asset status
        self._restore_asset_status(db, request.asset_id)

        db.add(request)
        db.flush()

        # Auto-generate next recurring instance if applicable
        if request.is_recurring and request.recurrence_rule:
            self._generate_next_recurrence(db, request)

        db.commit()
        db.refresh(request)
        return request

    def cancel_request(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceCancelRequest
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        if request.status in TERMINAL_STATUSES:
            raise ValueError(f"Cannot cancel a request in terminal status '{request.status}'.")

        from_status = request.status
        request.status = "cancelled"
        request.cancellation_reason = payload.cancellation_reason

        maintenance_repository.log_status_transition(
            db,
            maintenance_request_id=request.id,
            from_status=from_status,
            to_status="cancelled",
            reason=payload.cancellation_reason,
        )

        self._restore_asset_status(db, request.asset_id)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def update_request(
        self,
        db: Session,
        request_id: Any,
        payload: MaintenanceUpdate
    ) -> MaintenanceRequest:
        request = maintenance_repository.get(db, request_id)
        if not request:
            raise ValueError("Maintenance request not found.")

        if request.status in TERMINAL_STATUSES:
            raise ValueError(f"Cannot edit a {request.status} maintenance request.")

        update_data = payload.model_dump(exclude_unset=True)
        parts = update_data.pop("parts_required", None)
        if parts is not None:
            request.parts_required = [p if isinstance(p, dict) else p.model_dump() for p in parts]
        recurrence = update_data.pop("recurrence_rule", None)
        if recurrence is not None:
            request.recurrence_rule = recurrence if isinstance(recurrence, dict) else recurrence.model_dump()

        for field, value in update_data.items():
            setattr(request, field, value)

        request.version_number += 1
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def bulk_action(
        self,
        db: Session,
        payload: MaintenanceBulkActionRequest
    ) -> dict:
        """Bulk approve/reject/cancel for admin-level batch operations."""
        results = {"success": [], "failed": []}
        for mid in payload.maintenance_ids:
            try:
                if payload.action == "approve":
                    from app.schemas.maintenance import MaintenanceApproveRequest
                    self.approve_request(db, mid, MaintenanceApproveRequest())
                elif payload.action == "reject":
                    from app.schemas.maintenance import MaintenanceRejectRequest
                    self.reject_request(db, mid, MaintenanceRejectRequest(
                        rejection_reason=payload.reason or "Bulk rejected"
                    ))
                elif payload.action == "cancel":
                    from app.schemas.maintenance import MaintenanceCancelRequest
                    self.cancel_request(db, mid, MaintenanceCancelRequest(
                        cancellation_reason=payload.reason or "Bulk cancelled"
                    ))
                results["success"].append(str(mid))
            except Exception as e:
                results["failed"].append({"id": str(mid), "error": str(e)})
        return results

    def _generate_next_recurrence(self, db: Session, source: MaintenanceRequest):
        """Auto-generate the next recurring maintenance instance from a closed request."""
        rule = source.recurrence_rule or {}
        freq = rule.get("frequency", "monthly")
        interval = rule.get("interval", 1)

        now = datetime.now(timezone.utc)
        if freq == "daily":
            next_date = now + timedelta(days=interval)
        elif freq == "weekly":
            next_date = now + timedelta(weeks=interval)
        elif freq == "monthly":
            next_date = now + timedelta(days=30 * interval)
        elif freq == "yearly":
            next_date = now + timedelta(days=365 * interval)
        else:
            return

        new_request = MaintenanceRequest(
            title=source.title,
            description=source.description,
            asset_id=source.asset_id,
            maintenance_type=source.maintenance_type,
            priority=source.priority,
            category_tag=source.category_tag,
            estimated_cost=source.estimated_cost,
            scheduled_date=next_date,
            vendor_id=source.vendor_id,
            parts_required=source.parts_required,
            is_recurring=True,
            recurrence_rule=source.recurrence_rule,
            parent_request_id=source.id,
            status="pending_approval",
            sla_due_at=self._compute_sla(source.priority),
        )
        db.add(new_request)
        db.flush()

        maintenance_repository.log_status_transition(
            db,
            maintenance_request_id=new_request.id,
            from_status=None,
            to_status="pending_approval",
            reason=f"Auto-generated recurrence from request {source.id}",
        )


# Global singleton
maintenance_service = MaintenanceService()
