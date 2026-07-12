from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, UUID4

class BookingBase(BaseModel):
    asset_id: UUID4
    employee_id: UUID4
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v: datetime, info) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("End time must be strictly after start time.")
        return v

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=50)

    @field_validator("end_time")
    @classmethod
    def validate_update_times(cls, v: datetime, info) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("End time must be strictly after start time.")
        return v

class BookingResponse(BookingBase):
    id: UUID4
    status: str
    is_deleted: bool
    version_number: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
