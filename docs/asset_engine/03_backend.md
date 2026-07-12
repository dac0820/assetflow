# Asset Engine Backend Specification: AssetFlow ERP

This document contains the backend API contracts, Pydantic schemas, service layer functions, and background task rules for the **Asset Management Engine**.

---

## 1. Pydantic Validation Schemas

Input payloads are validated using Pydantic before queries are sent to PostgreSQL:

```python
# app/modules/assets/schemas.py
from datetime import date
from typing import Optional, Dict, Any
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

    @field_validator('salvage_value')
    @classmethod
    def validate_salvage(cls, v: float, info) -> float:
        cost = info.data.get('purchase_cost')
        if cost is not None and v > cost:
            raise ValueError("Salvage value cannot exceed purchase cost.")
        return v
```

---

## 2. Service Layer & Business Logic

The service layer coordinates database transactions and validates asset status transitions:

```python
# app/modules/assets/services.py
from app.modules.assets.repositories import AssetRepository
from app.modules.assets.schemas import AssetCreate

class AssetService:
    def __init__(self, repo: AssetRepository):
        self.repo = repo

    def create_asset(self, db: Session, asset_in: AssetCreate) -> Asset:
        # Business logic checks
        existing = self.repo.get_by_serial(db, serial=asset_in.serial_number)
        if existing:
            raise ValueError("Asset serial number is already registered.")
            
        return self.repo.create(db, obj_in=asset_in)

    def transition_status(self, db: Session, asset_id: UUID4, target_status: str) -> Asset:
        # Validate status change rules
        asset = self.repo.get(db, asset_id)
        if not asset:
            raise ValueError("Asset not found.")
            
        # Call the validation engine
        validate_lifecycle_transition(asset.status, target_status)
        
        return self.repo.update_status(db, db_obj=asset, status=target_status)
```

---

## 3. Asynchronous Background Tasks (Celery & Redis)

Resource-intensive operations are run asynchronously in the background:

1.  **Bulk QR Code Generation**:
    *   *Trigger*: A user imports a batch of 1,000 assets.
    *   *Action*: The API registers the assets and queues a Celery task to generate QR codes:
        ```python
        @celery_app.task
        def generate_bulk_qr_codes(asset_ids: list[str]):
            for asset_id in asset_ids:
                qr_service.create_qr_code(asset_id)
        ```
2.  **Report PDF Export**:
    *   *Trigger*: Request to generate a PDF valuation report.
    *   *Action*: The web server delegates PDF creation to a background worker, which sends a notification to the user's dashboard when complete.
