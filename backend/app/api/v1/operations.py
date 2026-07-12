from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.operations import operations_repository
from app.services.operations import operations_service
from app.schemas.operations import (
    AssetAllocationCreate,
    AssetAllocationUpdate,
    AssetAllocationResponse,
    TransferRequestCreate,
    TransferRequestResponse,
    TransferActionRequest
)

router = APIRouter(prefix="/operations", tags=["Operations"])

@router.post("/allocate", response_model=AssetAllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_asset(payload: AssetAllocationCreate, db: Session = Depends(get_db)):
    try:
        return operations_service.allocate_asset(db, allocation_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/return/{asset_id}", response_model=AssetAllocationResponse)
def return_asset(asset_id: UUID4, payload: AssetAllocationUpdate, db: Session = Depends(get_db)):
    try:
        return operations_service.return_asset(db, asset_id=asset_id, return_in=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/transfer", response_model=TransferRequestResponse, status_code=status.HTTP_201_CREATED)
def request_transfer(payload: TransferRequestCreate, db: Session = Depends(get_db)):
    try:
        # For simulation, we use a mock manager requester ID
        mock_requester_id = "c1a60fae-e2c7-4ebc-8854-3252199b0c20"
        return operations_service.request_transfer(db, transfer_in=payload, requester_id=mock_requester_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/transfers/pending", response_model=List[TransferRequestResponse])
def get_pending_transfers(db: Session = Depends(get_db)):
    return operations_repository.get_pending_transfers(db)

@router.post("/transfers/{id}/action", response_model=TransferRequestResponse)
def action_transfer(id: UUID4, payload: TransferActionRequest, db: Session = Depends(get_db)):
    try:
        return operations_service.action_transfer(db, request_id=id, action=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
