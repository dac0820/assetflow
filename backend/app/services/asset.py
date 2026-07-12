from typing import List, Dict, Any, Optional
from datetime import date
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.repositories.asset import asset_repository
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, DepreciationPeriod, DepreciationScheduleResponse

# Define valid state transition boundaries matching Maximo standards
LIFECYCLE_TRANSITIONS: Dict[str, List[str]] = {
    "available": ["allocated", "reserved", "maintenance", "retired", "lost"],
    "allocated": ["available", "maintenance", "lost", "retired"],
    "reserved": ["available", "allocated", "lost", "retired"],
    "maintenance": ["available", "lost", "retired"],
    "lost": ["available", "retired"],
    "retired": ["disposed"],
    "disposed": [] # Terminal state
}

def validate_lifecycle_transition(current_status: str, target_status: str) -> None:
    """
    Checks transition feasibility against the IAM state machine rules
    """
    current_status = current_status.lower()
    target_status = target_status.lower()
    
    if current_status == target_status:
        return
        
    allowed_next_states = LIFECYCLE_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_next_states:
        raise ValueError(
            f"Illegal status transition. Cannot update asset state from '{current_status}' to '{target_status}'."
        )

class AssetService:
    """
    Business Logic Layer for lifecycle status transitions and depreciation valuation schedules
    """
    def create_asset(self, db: Session, asset_in: AssetCreate) -> Asset:
        # Check uniqueness of serial number
        existing = asset_repository.get_by_serial(db, serial=asset_in.serial_number)
        if existing:
            raise ValueError(f"Asset with manufacturer serial number '{asset_in.serial_number}' already exists.")
            
        return asset_repository.create(db, obj_in=asset_in)

    def update_asset(self, db: Session, asset_id: UUID4, asset_in: AssetUpdate) -> Asset:
        asset = asset_repository.get(db, asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        # Verify read-only constraints for retired or disposed assets
        if asset.status in ["retired", "disposed"]:
            # If attempting to update fields other than changing status
            # we block updates
            non_status_updates = asset_in.dict(exclude_unset=True)
            non_status_updates.pop("status", None)
            if non_status_updates:
                raise ValueError(
                    f"Asset is '{asset.status}' and has become read-only. Metadata modifications are blocked."
                )
                
        # Validate status change if provided in payload
        if asset_in.status:
            validate_lifecycle_transition(asset.status, asset_in.status)
            
        return asset_repository.update(db, db_obj=asset, obj_in=asset_in)

    def calculate_depreciation(self, db: Session, asset_id: UUID4, method: str) -> DepreciationScheduleResponse:
        """
        Calculates the lifecycle depreciation schedules using Straight-Line or Double Declining formulas
        """
        asset = asset_repository.get(db, asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        cost = float(asset.purchase_cost)
        salvage = float(asset.salvage_value)
        life = asset.useful_life_years
        start_year = asset.purchase_date.year
        
        schedule: List[DepreciationPeriod] = []
        method = method.upper()
        
        if method == "STRAIGHT_LINE":
            # Straight Line formula: (Cost - Salvage) / Useful Life
            annual_depreciation = (cost - salvage) / life
            current_value = cost
            for i in range(1, life + 1):
                beg_val = current_value
                dep_amt = min(annual_depreciation, current_value - salvage)
                end_val = current_value - dep_amt
                current_value = end_val
                
                schedule.append(DepreciationPeriod(
                    fiscal_year=start_year + i - 1,
                    beginning_value=round(beg_val, 2),
                    depreciation_amount=round(dep_amt, 2),
                    ending_value=round(end_val, 2)
                ))
                
        elif method == "DOUBLE_DECLINING":
            # Double Declining Rate: 2.0 / Useful Life
            rate = 2.0 / life
            current_value = cost
            for i in range(1, life + 1):
                beg_val = current_value
                dep_amt = beg_val * rate
                
                # Cannot depreciate below salvage value
                if (current_value - dep_amt) < salvage:
                    dep_amt = current_value - salvage
                    
                end_val = current_value - dep_amt
                current_value = end_val
                
                schedule.append(DepreciationPeriod(
                    fiscal_year=start_year + i - 1,
                    beginning_value=round(beg_val, 2),
                    depreciation_amount=round(dep_amt, 2),
                    ending_value=round(end_val, 2)
                ))
        else:
            raise ValueError(f"Unsupported depreciation method '{method}'. Use 'STRAIGHT_LINE' or 'DOUBLE_DECLINING'.")
            
        return DepreciationScheduleResponse(
            asset_id=asset_id,
            method=method,
            schedule=schedule
        )

# Instantiate global asset service wrapper
asset_service = AssetService()
