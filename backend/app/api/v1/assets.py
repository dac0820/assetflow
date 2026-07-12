from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.asset import asset_repository
from app.services.asset import asset_service
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    BulkUpdateRequest,
    BulkUpdateResponse,
    BulkDeleteRequest,
    DepreciationScheduleResponse,
    AssetHistoryResponse,
    HistoryItem
)

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)):
    try:
        return asset_service.create_asset(db, asset_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("", response_model=List[AssetResponse])
def get_assets(
    search_term: Optional[str] = Query(None, description="Search term for name or serial number"),
    category_id: Optional[UUID4] = Query(None, description="Filter by Category UUID"),
    location_id: Optional[UUID4] = Query(None, description="Filter by Location UUID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by asset status"),
    min_cost: Optional[float] = Query(None, description="Filter by minimum cost"),
    max_cost: Optional[float] = Query(None, description="Filter by maximum cost"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    return asset_repository.search_assets(
        db,
        search_term=search_term,
        category_id=category_id,
        location_id=location_id,
        status=status_filter,
        min_cost=min_cost,
        max_cost=max_cost,
        skip=skip,
        limit=limit
    )

@router.get("/{id}", response_model=AssetResponse)
def get_asset(id: UUID4, db: Session = Depends(get_db)):
    asset = asset_repository.get(db, id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    return asset

@router.patch("/{id}", response_model=AssetResponse)
def update_asset(id: UUID4, payload: AssetUpdate, db: Session = Depends(get_db)):
    try:
        return asset_service.update_asset(db, asset_id=id, asset_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=AssetResponse)
def delete_asset(id: UUID4, db: Session = Depends(get_db)):
    asset = asset_repository.soft_delete(db, id=id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    return asset

@router.get("/{id}/depreciation", response_model=DepreciationScheduleResponse)
def get_asset_depreciation(
    id: UUID4,
    method: str = Query("STRAIGHT_LINE", description="STRAIGHT_LINE or DOUBLE_DECLINING"),
    db: Session = Depends(get_db)
):
    try:
        return asset_service.calculate_depreciation(db, asset_id=id, method=method)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/bulk-update", response_model=BulkUpdateResponse)
def bulk_update_assets(payload: BulkUpdateRequest, db: Session = Depends(get_db)):
    updated = 0
    failed: List[UUID4] = []
    
    # Iterate and transition each asset inside a transaction
    for asset_id in payload.asset_ids:
        try:
            update_data = AssetUpdate()
            if payload.status:
                update_data.status = payload.status
            if payload.location_id:
                update_data.location_id = payload.location_id
                
            asset_service.update_asset(db, asset_id=asset_id, asset_in=update_data)
            updated += 1
        except ValueError:
            failed.append(asset_id)
            
    return {"updated_count": updated, "failed_asset_ids": failed}

@router.post("/bulk-delete", response_model=BulkUpdateResponse)
def bulk_delete_assets(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    deleted = 0
    failed: List[UUID4] = []
    
    for asset_id in payload.asset_ids:
        res = asset_repository.soft_delete(db, id=asset_id)
        if res:
            deleted += 1
        else:
            failed.append(asset_id)
            
    return {"updated_count": deleted, "failed_asset_ids": failed}

@router.get("/{id}/history", response_model=AssetHistoryResponse)
def get_asset_history(id: UUID4, db: Session = Depends(get_db)):
    # Check asset existence
    asset = asset_repository.get(db, id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
        
    allocations = asset_repository.get_allocation_history(db, asset_id=id)
    history_items: List[HistoryItem] = []
    
    for alloc in allocations:
        notes = f"Allocated to employee {alloc.employee.first_name} {alloc.employee.last_name}" if alloc.employee else "Allocated"
        if alloc.returned_at:
            notes += f" (Returned on {alloc.returned_at})"
            
        history_items.append(
            HistoryItem(
                event_type="allocation",
                action="allocated" if not alloc.returned_at else "returned",
                performed_by="System Agent",
                timestamp=alloc.allocated_at,
                notes=notes
            )
        )
        
    return {"asset_id": id, "history": history_items}
