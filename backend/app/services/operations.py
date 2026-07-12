from datetime import datetime
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.repositories.operations import operations_repository
from app.repositories.asset import asset_repository
from app.models.operations import AssetAllocation, TransferRequest
from app.models.asset import Asset
from app.schemas.operations import (
    AssetAllocationCreate,
    AssetAllocationUpdate,
    TransferRequestCreate,
    TransferActionRequest
)

class OperationsService:
    """
    Business Logic Layer for allocations custody, resource bookings, and cross-department movement approvals
    """
    def allocate_asset(self, db: Session, allocation_in: AssetAllocationCreate) -> AssetAllocation:
        # Fetch target asset
        asset = asset_repository.get(db, allocation_in.asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        # Verify business rules: inactive/retired assets cannot be allocated
        if asset.status in ["retired", "disposed"]:
            raise ValueError(f"Cannot allocate asset with terminal status '{asset.status}'.")
            
        # Verify asset is not already allocated
        active = operations_repository.get_active_allocation(db, asset.id)
        if active:
            raise ValueError("Asset is already allocated to another employee.")
            
        # Update asset status
        asset.status = "allocated"
        db.add(asset)
        
        # Create allocation
        return operations_repository.create_allocation(db, obj_in=allocation_in)

    def return_asset(self, db: Session, asset_id: UUID4, return_in: AssetAllocationUpdate) -> AssetAllocation:
        asset = asset_repository.get(db, asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        active = operations_repository.get_active_allocation(db, asset.id)
        if not active:
            raise ValueError("No active allocation found for this asset.")
            
        # Close allocation custody
        active.returned_at = datetime.utcnow()
        active.condition_on_return = return_in.condition_on_return or "Good"
        active.notes = return_in.notes
        
        # Update asset status
        asset.status = "available"
        db.add(active)
        db.add(asset)
        db.commit()
        
        return active

    def request_transfer(self, db: Session, transfer_in: TransferRequestCreate, requester_id: UUID4) -> TransferRequest:
        asset = asset_repository.get(db, transfer_in.asset_id)
        if not asset:
            raise ValueError("Target asset not found.")
            
        # Verify active allocation custody
        active = operations_repository.get_active_allocation(db, asset.id)
        if not active:
            raise ValueError("Asset must be allocated to an employee before initiating a transfer request.")
            
        # Source employee is the current holder
        source_id = active.employee_id
        
        # Create request
        return operations_repository.create_transfer_request(
            db, obj_in=transfer_in, source_employee_id=source_id, requested_by=requester_id
        )

    def action_transfer(self, db: Session, request_id: UUID4, action: TransferActionRequest) -> TransferRequest:
        req = db.query(TransferRequest).filter(TransferRequest.id == request_id).first()
        if not req:
            raise ValueError("Transfer request not found.")
            
        if req.status != "requested":
            raise ValueError(f"Transfer request already processed. Current status is '{req.status}'.")
            
        req.status = action.status.upper()
        req.actioned_at = datetime.utcnow()
        
        if req.status == "APPROVED":
            # 1. Close current allocation
            active_alloc = operations_repository.get_active_allocation(db, req.asset_id)
            if active_alloc:
                active_alloc.returned_at = datetime.utcnow()
                active_alloc.condition_on_return = "Good"
                db.add(active_alloc)
                
            # 2. Create new allocation for target employee
            new_alloc = AssetAllocation(
                asset_id=req.asset_id,
                employee_id=req.target_employee_id,
                allocated_at=datetime.utcnow(),
                condition_on_allocation="Excellent",
                notes=f"Approved transfer from Request ID: {req.id}"
            )
            db.add(new_alloc)
            
            # 3. Update asset registry holder if applicable
            asset = asset_repository.get(db, req.asset_id)
            if asset:
                asset.status = "allocated"
                db.add(asset)
        else:
            req.rejection_reason = action.rejection_reason
            
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

# Instantiate global operations service wrapper
operations_service = OperationsService()
