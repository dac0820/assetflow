# Repository Layer & Testing: AssetFlow ERP

This document specifies the database Repository design pattern, transactional boundaries, and database testing strategy for **AssetFlow ERP**.

---

## 1. Repository Pattern Blueprint

AssetFlow implements the Repository Pattern to decouple database queries from the business logic layer.

### 1.1 Base Repository Interface
Every entity repository inherits from a generic base repository containing default CRUD actions:

```python
# app/repositories/base.py
from typing import Generic, Type, TypeVar, Optional, list
from sqlalchemy.orm import Session
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: any) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id, self.model.is_deleted == False).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return db.query(self.model).filter(self.model.is_deleted == False).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: any) -> ModelType:
        db_obj = self.model(**obj_in.dict())
        db.add(db_obj)
        return db_obj

    def soft_delete(self, db: Session, *, id: any) -> Optional[ModelType]:
        db_obj = self.get(db, id)
        if db_obj:
            db_obj.is_deleted = True
            db.add(db_obj)
        return db_obj
```

---

## 2. Database Transaction Boundaries

To prevent partial writes and ensure data consistency:
1.  **FastAPI Session Injection**: The database session (`SessionLocal`) is injected into routers using FastAPI's dependency injection (`Depends(get_db)`).
2.  **Transaction Context Manager**: Multi-step operations (like transferring an asset and writing to the audit log) are executed inside an atomic transaction:
    ```python
    # app/services/transfer.py
    def execute_transfer(db: Session, transfer_id: uuid.UUID):
        with db.begin():
            # Executing database changes
            transfer = transfer_repo.approve(db, id=transfer_id)
            asset_repo.update_location(db, id=transfer.asset_id, loc_id=transfer.target_location_id)
            # Both updates commit together. Rollback occurs automatically on failure.
    ```

---

## 3. Database Testing Strategy

### 3.1 Migration Upgrade/Downgrade Tests
*   **Goal**: Confirm migrations apply and roll back cleanly without data loss.
*   **Test Script**:
    ```python
    def test_migration_upgrade_downgrade(alembic_runner):
        # Apply migration to head
        alembic_runner.migrate_up("head")
        
        # Verify schema state
        assert alembic_runner.current_head() is not None
        
        # Downgrade to base
        alembic_runner.migrate_down("base")
    ```

### 3.2 Constraint Verification Tests
*   **Goal**: Confirm database check constraints reject invalid data inputs.
*   **Test Case**:
    ```python
    def test_salvage_value_constraint(db_session):
        invalid_asset = Asset(
            name="Laptop",
            serial_number="SN-1234",
            purchase_cost=1000.00,
            salvage_value=1200.00,  # Exceeds purchase cost
            useful_life_years=3
        )
        db_session.add(invalid_asset)
        
        # Assert database check constraint triggers IntegrityError
        with pytest.raises(IntegrityError):
            db_session.commit()
    ```
