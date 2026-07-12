from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, UUID4

class AssetAllocationBase(BaseModel):
    asset_id: UUID4
    employee_id: UUID4
    expected_return_at: Optional[datetime] = None
    notes: Optional[str] = None
    condition_on_allocation: Optional[str] = Field("Excellent", max_length=100)

class AssetAllocationCreate(AssetAllocationBase):
    pass

class AssetAllocationUpdate(BaseModel):
    returned_at: Optional[datetime] = None
    condition_on_return: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class AssetAllocationResponse(AssetAllocationBase):
    id: UUID4
    allocated_at: datetime
    returned_at: Optional[datetime] = None
    condition_on_return: Optional[str] = None

    class Config:
        from_attributes = True

class TransferRequestBase(BaseModel):
    asset_id: UUID4
    target_employee_id: UUID4
    notes: Optional[str] = None

class TransferRequestCreate(TransferRequestBase):
    pass

class TransferActionRequest(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    rejection_reason: Optional[str] = None

class TransferRequestResponse(TransferRequestBase):
    id: UUID4
    source_employee_id: UUID4
    requested_by: UUID4
    status: str
    requested_at: datetime
    actioned_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: UUID4
    asset_id: UUID4
    employee_id: UUID4
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True

class MaintenanceResponse(BaseModel):
    id: UUID4
    asset_id: UUID4
    cost: float
    notes: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
