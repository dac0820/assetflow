# SQLAlchemy Model Blueprint: AssetFlow ERP

This document contains the SQLAlchemy model layout, mixin classes, enums, and entity mapping schemas for **AssetFlow ERP**.

---

## 1. Core Base Model & Audit Mixin

To enforce consistent data governance across all tables, every model inherits from a shared declarative base and audit mixin:

```python
# app/models/base.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship

class Base(DeclarativeBase):
    pass

class AuditMixin:
    """
    Enforces tracking standards on every database table
    """
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String(50), nullable=False, default="active")
    
    # Audit tracking fields
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True) # References users.id
    updated_by = Column(UUID(as_uuid=True), nullable=True) # References users.id
    
    # Flags & locking parameters
    is_deleted = Column(Boolean, default=False, nullable=False)
    version_number = Column(Integer, default=1, nullable=False) # For optimistic locking
```

---

## 2. Core Entity Mappings

---

### 2.1 User Model (`app/models/user.py`)
```python
class User(Base, AuditMixin):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    employee = relationship("Employee", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
```

---

### 2.2 Role Model (`app/models/role.py`)
```python
class Role(Base, AuditMixin):
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")
```

---

### 2.3 Asset Model (`app/models/asset.py`)
```python
class Asset(Base, AuditMixin):
    __tablename__ = "assets"
    
    name = Column(String(255), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("asset_categories.id", ondelete="RESTRICT"), nullable=False)
    purchase_cost = Column(Numeric(15, 2), nullable=False)
    purchase_date = Column(Date, nullable=False)
    salvage_value = Column(Numeric(15, 2), default=0.00, nullable=False)
    useful_life_years = Column(Integer, nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    
    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    location = relationship("Location", back_populates="assets")
    allocations = relationship("AssetAllocation", back_populates="asset", cascade="all, delete-orphan")
    maintenance_records = relationship("Maintenance", back_populates="asset")
    warranty = relationship("Warranty", uselist=False, back_populates="asset", cascade="all, delete-orphan")
    qr_code = relationship("QRCode", uselist=False, back_populates="asset", cascade="all, delete-orphan")
```

---

### 2.4 Asset Allocation Model (`app/models/allocation.py`)
```python
class AssetAllocation(Base, AuditMixin):
    __tablename__ = "asset_allocations"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    allocated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", back_populates="allocations")
```

---

### 2.5 Audit Cycle Model (`app/models/audit.py`)
```python
class AuditCycle(Base, AuditMixin):
    __tablename__ = "audit_cycles"
    
    title = Column(String(100), nullable=False)
    scheduled_start = Column(Date, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    results = relationship("AuditResult", back_populates="cycle", cascade="all, delete-orphan")
```
Using this layout, every model includes audit tracking, version numbers for optimistic concurrency checks, and soft delete flags, ensuring compliance with data governance standards.
