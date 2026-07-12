from typing import Optional, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.repositories.base import BaseRepository
from app.models.operations import AssetAllocation, TransferRequest, Booking, Maintenance
from app.schemas.operations import AssetAllocationCreate, TransferRequestCreate

class OperationsRepository:
    """
    Data Access Layer operations for asset movement, temporary bookings, and repairs tracking
    """
    def get_active_allocation(self, db: Session, asset_id: Any) -> Optional[AssetAllocation]:
        """
        Retrieves active allocation record where returned_at is null
        """
        return db.query(AssetAllocation).filter(
            AssetAllocation.asset_id == asset_id,
            AssetAllocation.returned_at == None,
            AssetAllocation.is_deleted == False
        ).first()

    def get_employee_active_allocations(self, db: Session, employee_id: Any) -> List[AssetAllocation]:
        return db.query(AssetAllocation).filter(
            AssetAllocation.employee_id == employee_id,
            AssetAllocation.returned_at == None,
            AssetAllocation.is_deleted == False
        ).all()

    def check_booking_overlap(
        self, db: Session, asset_id: Any, start_time: datetime, end_time: datetime
    ) -> bool:
        """
        Checks if there are conflicting reservations for the same asset within the time slot
        """
        conflicting = db.query(Booking).filter(
            Booking.asset_id == asset_id,
            Booking.status == "approved",
            Booking.is_deleted == False,
            or_(
                and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        ).first()
        return conflicting is not None

    def get_pending_transfers(self, db: Session) -> List[TransferRequest]:
        return db.query(TransferRequest).filter(
            TransferRequest.status == "requested",
            TransferRequest.is_deleted == False
        ).order_by(TransferRequest.requested_at.desc()).all()

    def create_allocation(self, db: Session, obj_in: AssetAllocationCreate) -> AssetAllocation:
        db_obj = AssetAllocation(
            asset_id=obj_in.asset_id,
            employee_id=obj_in.employee_id,
            expected_return_at=obj_in.expected_return_at,
            notes=obj_in.notes,
            condition_on_allocation=obj_in.condition_on_allocation,
            allocated_at=datetime.utcnow()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_transfer_request(
        self, db: Session, obj_in: TransferRequestCreate, source_employee_id: Any, requested_by: Any
    ) -> TransferRequest:
        db_obj = TransferRequest(
            asset_id=obj_in.asset_id,
            source_employee_id=source_employee_id,
            target_employee_id=obj_in.target_employee_id,
            requested_by=requested_by,
            notes=obj_in.notes,
            status="requested",
            requested_at=datetime.utcnow()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Instantiate global operations repository wrapper
operations_repository = OperationsRepository()
