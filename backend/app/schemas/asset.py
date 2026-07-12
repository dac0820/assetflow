from datetime import date, datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator, UUID4

class AssetBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    serial_number: str = Field(..., min_length=3, max_length=100)
    category_id: UUID4
    purchase_cost: float = Field(..., gt=0.0)
    purchase_date: date
    salvage_value: float = Field(default=0.0, ge=0.0)
    useful_life_years: int = Field(..., ge=1)
    location_id: UUID4
    custom_metadata: Optional[Dict[str, Any]] = {}

    @field_validator("salvage_value")
    @classmethod
    def validate_salvage(cls, v: float, info) -> float:
        cost = info.data.get("purchase_cost")
        if cost is not None and v > cost:
            raise ValueError("Salvage value cannot exceed purchase cost.")
        return v

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    serial_number: Optional[str] = Field(None, min_length=3, max_length=100)
    category_id: Optional[UUID4] = None
    purchase_cost: Optional[float] = Field(None, gt=0.0)
    purchase_date: Optional[date] = None
    salvage_value: Optional[float] = Field(None, ge=0.0)
    useful_life_years: Optional[int] = Field(None, ge=1)
    location_id: Optional[UUID4] = None
    status: Optional[str] = None
    custom_metadata: Optional[Dict[str, Any]] = None

class AssetResponse(AssetBase):
    id: UUID4
    status: str
    is_deleted: bool
    version_number: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BulkUpdateRequest(BaseModel):
    asset_ids: List[UUID4]
    status: Optional[str] = None
    location_id: Optional[UUID4] = None

class BulkUpdateResponse(BaseModel):
    updated_count: int
    failed_asset_ids: List[UUID4]

class BulkDeleteRequest(BaseModel):
    asset_ids: List[UUID4]

class DepreciationPeriod(BaseModel):
    fiscal_year: int
    beginning_value: float
    depreciation_amount: float
    ending_value: float

class DepreciationScheduleResponse(BaseModel):
    asset_id: UUID4
    method: str
    schedule: List[DepreciationPeriod]

class HistoryItem(BaseModel):
    event_type: str
    action: str
    performed_by: str
    timestamp: datetime
    notes: Optional[str] = None

class AssetHistoryResponse(BaseModel):
    asset_id: UUID4
    history: List[HistoryItem]
