"""
Enterprise CMMS — Maintenance Repository Layer
Data Access Layer for MaintenanceRequest and related entities.
"""
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from app.repositories.base import BaseRepository
from app.models.maintenance import (
    MaintenanceRequest, MaintenanceAttachment,
    MaintenanceComment, MaintenanceStatusLog,
    SLA_HOURS
)
from app.schemas.maintenance import (
    MaintenanceCreate, MaintenanceUpdate,
    MaintenanceAttachmentCreate, MaintenanceCommentCreate
)


class MaintenanceRepository(BaseRepository[MaintenanceRequest]):
    """
    Data Access Layer for CMMS maintenance work orders.
    """
    def __init__(self):
        super().__init__(MaintenanceRequest)

    # ── QUERY METHODS ────────────────────────────────────────────────────────

    def get_with_filters(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        maintenance_type: Optional[str] = None,
        asset_id: Optional[Any] = None,
        technician_id: Optional[Any] = None,
        vendor_id: Optional[Any] = None,
        search_term: Optional[str] = None,
        sla_breached: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[MaintenanceRequest]:
        """Multi-parameter search with SLA breach detection."""
        query = db.query(self.model).filter(self.model.is_deleted == False)

        if status:
            query = query.filter(self.model.status == status)
        if priority:
            query = query.filter(self.model.priority == priority)
        if maintenance_type:
            query = query.filter(self.model.maintenance_type == maintenance_type)
        if asset_id:
            query = query.filter(self.model.asset_id == asset_id)
        if technician_id:
            query = query.filter(self.model.assigned_technician_id == technician_id)
        if vendor_id:
            query = query.filter(self.model.vendor_id == vendor_id)
        if search_term:
            query = query.filter(
                or_(
                    self.model.title.ilike(f"%{search_term}%"),
                    self.model.description.ilike(f"%{search_term}%"),
                    self.model.category_tag.ilike(f"%{search_term}%"),
                )
            )
        if sla_breached is True:
            now = datetime.now(timezone.utc)
            query = query.filter(
                self.model.sla_due_at < now,
                self.model.status.notin_(["resolved", "closed", "rejected", "cancelled"])
            )

        return query.order_by(
            desc(self.model.priority == "critical"),
            desc(self.model.priority == "high"),
            desc(self.model.created_at)
        ).offset(skip).limit(limit).all()

    def count_with_filters(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        maintenance_type: Optional[str] = None,
        asset_id: Optional[Any] = None,
        technician_id: Optional[Any] = None,
        search_term: Optional[str] = None,
    ) -> int:
        query = db.query(func.count(self.model.id)).filter(self.model.is_deleted == False)
        if status:
            query = query.filter(self.model.status == status)
        if priority:
            query = query.filter(self.model.priority == priority)
        if maintenance_type:
            query = query.filter(self.model.maintenance_type == maintenance_type)
        if asset_id:
            query = query.filter(self.model.asset_id == asset_id)
        if technician_id:
            query = query.filter(self.model.assigned_technician_id == technician_id)
        if search_term:
            query = query.filter(
                or_(
                    self.model.title.ilike(f"%{search_term}%"),
                    self.model.description.ilike(f"%{search_term}%"),
                )
            )
        return query.scalar()

    def get_by_asset(self, db: Session, asset_id: Any) -> List[MaintenanceRequest]:
        return db.query(self.model).filter(
            self.model.asset_id == asset_id,
            self.model.is_deleted == False
        ).order_by(desc(self.model.created_at)).all()

    def get_by_technician(self, db: Session, technician_id: Any) -> List[MaintenanceRequest]:
        return db.query(self.model).filter(
            self.model.assigned_technician_id == technician_id,
            self.model.is_deleted == False,
            self.model.status.notin_(["closed", "rejected", "cancelled"])
        ).order_by(desc(self.model.priority == "critical")).all()

    def get_overdue(self, db: Session) -> List[MaintenanceRequest]:
        """Returns all SLA-breached open requests."""
        now = datetime.now(timezone.utc)
        return db.query(self.model).filter(
            self.model.is_deleted == False,
            self.model.sla_due_at != None,
            self.model.sla_due_at < now,
            self.model.status.notin_(["resolved", "closed", "rejected", "cancelled"])
        ).order_by(self.model.sla_due_at.asc()).all()

    def get_calendar_events(
        self,
        db: Session,
        start: datetime,
        end: datetime
    ) -> List[MaintenanceRequest]:
        """Returns maintenance requests scheduled within a date window."""
        return db.query(self.model).filter(
            self.model.is_deleted == False,
            or_(
                and_(self.model.scheduled_date >= start, self.model.scheduled_date <= end),
                and_(self.model.actual_start_at >= start, self.model.actual_start_at <= end),
                and_(self.model.sla_due_at >= start, self.model.sla_due_at <= end),
            )
        ).all()

    def check_duplicate_within_24h(
        self,
        db: Session,
        asset_id: Any,
        maintenance_type: str
    ) -> bool:
        """24-hour duplicate detection for the same asset + type combo."""
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        existing = db.query(self.model).filter(
            self.model.asset_id == asset_id,
            self.model.maintenance_type == maintenance_type,
            self.model.created_at >= cutoff,
            self.model.status.notin_(["rejected", "cancelled"]),
            self.model.is_deleted == False
        ).first()
        return existing is not None

    def get_analytics(self, db: Session) -> Dict[str, Any]:
        """Aggregated analytics for the maintenance dashboard."""
        total = db.query(func.count(self.model.id)).filter(
            self.model.is_deleted == False
        ).scalar()

        # By status
        status_rows = db.query(
            self.model.status, func.count(self.model.id)
        ).filter(self.model.is_deleted == False).group_by(self.model.status).all()

        # By type
        type_rows = db.query(
            self.model.maintenance_type, func.count(self.model.id)
        ).filter(self.model.is_deleted == False).group_by(self.model.maintenance_type).all()

        # By priority
        priority_rows = db.query(
            self.model.priority, func.count(self.model.id)
        ).filter(self.model.is_deleted == False).group_by(self.model.priority).all()

        # Totals
        cost_row = db.query(
            func.coalesce(func.sum(self.model.actual_cost), 0),
            func.coalesce(func.sum(self.model.estimated_cost), 0),
            func.coalesce(func.sum(self.model.labor_hours), 0),
        ).filter(self.model.is_deleted == False).first()

        # Overdue
        now = datetime.now(timezone.utc)
        overdue_count = db.query(func.count(self.model.id)).filter(
            self.model.is_deleted == False,
            self.model.sla_due_at != None,
            self.model.sla_due_at < now,
            self.model.status.notin_(["resolved", "closed", "rejected", "cancelled"])
        ).scalar()

        # Open requests
        open_count = db.query(func.count(self.model.id)).filter(
            self.model.is_deleted == False,
            self.model.status.notin_(["closed", "rejected", "cancelled"])
        ).scalar()

        # Avg resolution hours (for closed requests with both start and end)
        avg_res = db.query(
            func.avg(
                func.extract("epoch", self.model.resolved_at - self.model.actual_start_at) / 3600
            )
        ).filter(
            self.model.is_deleted == False,
            self.model.resolved_at != None,
            self.model.actual_start_at != None,
        ).scalar()

        # SLA compliance % (closed on time / total closed)
        total_closed = db.query(func.count(self.model.id)).filter(
            self.model.is_deleted == False,
            self.model.status == "closed"
        ).scalar()

        on_time_closed = db.query(func.count(self.model.id)).filter(
            self.model.is_deleted == False,
            self.model.status == "closed",
            or_(
                self.model.sla_due_at == None,
                self.model.resolved_at <= self.model.sla_due_at
            )
        ).scalar()

        sla_pct = round((on_time_closed / total_closed * 100), 1) if total_closed else None

        return {
            "total_requests": total,
            "by_status": {row[0]: row[1] for row in status_rows},
            "by_type": {row[0]: row[1] for row in type_rows},
            "by_priority": {row[0]: row[1] for row in priority_rows},
            "avg_resolution_hours": round(float(avg_res), 2) if avg_res else None,
            "sla_compliance_pct": sla_pct,
            "total_actual_cost": float(cost_row[0]) if cost_row else 0.0,
            "total_estimated_cost": float(cost_row[1]) if cost_row else 0.0,
            "total_labor_hours": float(cost_row[2]) if cost_row else 0.0,
            "open_requests": open_count,
            "overdue_count": overdue_count,
        }

    # ── STATUS LOG ───────────────────────────────────────────────────────────

    def log_status_transition(
        self,
        db: Session,
        *,
        maintenance_request_id: Any,
        from_status: Optional[str],
        to_status: str,
        changed_by_id: Optional[Any] = None,
        reason: Optional[str] = None,
        snapshot: Optional[Dict] = None,
    ) -> MaintenanceStatusLog:
        """Write an immutable status transition record."""
        log = MaintenanceStatusLog(
            maintenance_request_id=maintenance_request_id,
            from_status=from_status,
            to_status=to_status,
            changed_by_id=changed_by_id,
            reason=reason,
            metadata_snapshot=snapshot or {},
        )
        db.add(log)
        return log

    # ── ATTACHMENT METHODS ───────────────────────────────────────────────────

    def add_attachment(
        self,
        db: Session,
        *,
        maintenance_request_id: Any,
        attachment_in: MaintenanceAttachmentCreate
    ) -> MaintenanceAttachment:
        attachment = MaintenanceAttachment(
            maintenance_request_id=maintenance_request_id,
            **attachment_in.model_dump()
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

    def get_attachments(
        self,
        db: Session,
        maintenance_request_id: Any
    ) -> List[MaintenanceAttachment]:
        return db.query(MaintenanceAttachment).filter(
            MaintenanceAttachment.maintenance_request_id == maintenance_request_id,
            MaintenanceAttachment.is_deleted == False
        ).order_by(MaintenanceAttachment.created_at.desc()).all()

    # ── COMMENT METHODS ──────────────────────────────────────────────────────

    def add_comment(
        self,
        db: Session,
        *,
        maintenance_request_id: Any,
        comment_in: MaintenanceCommentCreate
    ) -> MaintenanceComment:
        comment = MaintenanceComment(
            maintenance_request_id=maintenance_request_id,
            **comment_in.model_dump()
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment

    def get_comments(
        self,
        db: Session,
        maintenance_request_id: Any,
        include_internal: bool = True
    ) -> List[MaintenanceComment]:
        query = db.query(MaintenanceComment).filter(
            MaintenanceComment.maintenance_request_id == maintenance_request_id,
            MaintenanceComment.is_deleted == False
        )
        if not include_internal:
            query = query.filter(MaintenanceComment.is_internal == False)
        return query.order_by(MaintenanceComment.created_at.asc()).all()

    def get_status_timeline(
        self,
        db: Session,
        maintenance_request_id: Any
    ) -> List[MaintenanceStatusLog]:
        return db.query(MaintenanceStatusLog).filter(
            MaintenanceStatusLog.maintenance_request_id == maintenance_request_id
        ).order_by(MaintenanceStatusLog.created_at.asc()).all()


# Global singleton
maintenance_repository = MaintenanceRepository()
