from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.bookings import bookings_repository
from app.services.bookings import bookings_service
from app.schemas.bookings import (
    BookingCreate,
    BookingUpdate,
    BookingResponse
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    try:
        return bookings_service.create_booking(db, booking_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("", response_model=List[BookingResponse])
def get_bookings(
    asset_id: Optional[UUID4] = Query(None, description="Filter bookings by Asset UUID"),
    employee_id: Optional[UUID4] = Query(None, description="Filter bookings by Employee UUID"),
    db: Session = Depends(get_db)
):
    if asset_id:
        return bookings_repository.get_by_asset(db, asset_id=asset_id)
    if employee_id:
        return bookings_repository.get_by_employee(db, employee_id=employee_id)
    return db.query(bookings_repository.model).filter(
        bookings_repository.model.is_deleted == False
    ).order_by(bookings_repository.model.start_time.asc()).all()

@router.get("/{id}", response_model=BookingResponse)
def get_booking(id: UUID4, db: Session = Depends(get_db)):
    booking = bookings_repository.get(db, id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking

@router.patch("/{id}", response_model=BookingResponse)
def update_booking(id: UUID4, payload: BookingUpdate, db: Session = Depends(get_db)):
    try:
        return bookings_service.update_booking(db, booking_id=id, booking_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=BookingResponse)
def cancel_booking(id: UUID4, db: Session = Depends(get_db)):
    try:
        return bookings_service.cancel_booking(db, booking_id=id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
