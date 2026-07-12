from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Department(Base, AuditMixin):
    __tablename__ = "departments"
    
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    
    # Relationships
    employees = relationship("Employee", back_populates="department")

class Employee(Base, AuditMixin):
    __tablename__ = "employees"
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=True)
    
    # Relationships
    department = relationship("Department", back_populates="employees")
    user = relationship("User", uselist=False, primaryjoin="User.employee_id == Employee.id", foreign_keys="User.employee_id")
    allocations = relationship("AssetAllocation", back_populates="employee")

class Location(Base, AuditMixin):
    __tablename__ = "locations"
    
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    address = Column(String(255), nullable=True)
    
    # Relationships
    assets = relationship("Asset", back_populates="location")

class Vendor(Base, AuditMixin):
    __tablename__ = "vendors"
    
    name = Column(String(100), unique=True, nullable=False)
    contact_email = Column(String(255), nullable=True)
    support_phone = Column(String(20), nullable=True)
    
    # Relationships
    warranties = relationship("Warranty", back_populates="vendor")
