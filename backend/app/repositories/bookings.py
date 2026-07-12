from typing import Optional, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.repositories.base import BaseRepository
from app.models.operations import Booking
from app.schemas.bookings import BookingCreate, BookingUpdate

class BookingsRepository(BaseRepository[Booking]):
    """
    Data Access Layer operations for temporary reservations and calendar entries
    """
    def __init__(self):
        super().__init__(Booking)

    def check_overlap(
        self,
        db: Session,
        *,
        asset_id: Any,
        start_time: datetime,
        end_time: datetime,
        exclude_booking_id: Optional[Any] = None
    ) -> bool:
        """
        Detects conflicting reservations for the same asset within the specified time range.
        Excludes a specific booking ID if updating.
        """
        query = db.query(self.model).filter(
            self.model.asset_id == asset_id,
            self.model.status == "approved",
            self.model.is_deleted == False
        )

        if exclude_booking_id:
            query = query.filter(self.model.id != exclude_booking_id)

        overlap = query.filter(
            or_(
                # 1. New start time falls inside an existing booking
                and_(self.model.start_time <= start_time, self.model.end_time > start_time),
                # 2. New end time falls inside an existing booking
                and_(self.model.start_time < end_time, self.model.end_time >= end_time),
                # 3. New booking completely wraps an existing booking
                and_(self.model.start_time >= start_time, self.model.end_time <= end_time)
            )
        ).first()

        return overlap is not None

    def get_by_asset(self, db: Session, asset_id: Any) -> List[Booking]:
        return db.query(self.model).filter(
            self.model.asset_id == asset_id,
            self.model.is_deleted == False
        ).order_by(self.model.start_time.asc()).all()

    def get_by_employee(self, db: Session, employee_id: Any) -> List[Booking]:
        return db.query(self.model).filter(
            self.model.employee_id == employee_id,
            self.model.is_deleted == False
        ).order_by(self.model.start_time.desc()).all()

# Instantiate global bookings repository wrapper
bookings_repository = BookingsRepository()
