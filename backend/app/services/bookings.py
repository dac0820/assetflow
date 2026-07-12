from typing import List
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.repositories.bookings import bookings_repository
from app.repositories.asset import asset_repository
from app.models.operations import Booking
from app.schemas.bookings import BookingCreate, BookingUpdate

class BookingsService:
    """
    Business Logic Layer for resource reservations, agenda slots, and overlap conflict checking
    """
    def create_booking(self, db: Session, booking_in: BookingCreate) -> Booking:
        # Check target asset status
        asset = asset_repository.get(db, booking_in.asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        if asset.status in ["retired", "disposed", "maintenance"]:
            raise ValueError(
                f"Cannot book resource. Asset status is '{asset.status}' and is currently unavailable."
            )
            
        # Check for scheduling overlap conflicts
        has_overlap = bookings_repository.check_overlap(
            db,
            asset_id=booking_in.asset_id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time
        )
        if has_overlap:
            raise ValueError("Time slot conflict: The resource is already reserved during the requested period.")
            
        # Register new booking
        db_obj = Booking(
            asset_id=booking_in.asset_id,
            employee_id=booking_in.employee_id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time,
            status="approved" # Auto-approvals for conflict-free calendars
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_booking(self, db: Session, booking_id: UUID4, booking_in: BookingUpdate) -> Booking:
        booking = bookings_repository.get(db, booking_id)
        if not booking:
            raise ValueError("Target booking not found.")
            
        # Check scheduling conflicts if shifting time slot boundaries
        new_start = booking_in.start_time or booking.start_time
        new_end = booking_in.end_time or booking.end_time
        
        if booking_in.start_time or booking_in.end_time:
            has_overlap = bookings_repository.check_overlap(
                db,
                asset_id=booking.asset_id,
                start_time=new_start,
                end_time=new_end,
                exclude_booking_id=booking.id
            )
            if has_overlap:
                raise ValueError("Time slot conflict: The resource is already reserved during the requested period.")
                
        return bookings_repository.update(db, db_obj=booking, obj_in=booking_in)

    def cancel_booking(self, db: Session, booking_id: UUID4) -> Booking:
        booking = bookings_repository.get(db, booking_id)
        if not booking:
            raise ValueError("Target booking not found.")
            
        # Update status to cancelled
        update_data = BookingUpdate(status="cancelled")
        return bookings_repository.update(db, db_obj=booking, obj_in=update_data)

# Instantiate global bookings service wrapper
bookings_service = BookingsService()
