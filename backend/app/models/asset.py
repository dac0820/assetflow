from sqlalchemy import Column, String, Numeric, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class AssetCategory(Base, AuditMixin):
    __tablename__ = "asset_categories"
    
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationships
    assets = relationship("Asset", back_populates="category")

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
    
    # Custom metadata support using PostgreSQL JSONB
    custom_metadata = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    location = relationship("Location", back_populates="assets")
    allocations = relationship("AssetAllocation", back_populates="asset", cascade="all, delete-orphan")
    warranty = relationship("Warranty", uselist=False, back_populates="asset", cascade="all, delete-orphan")
    qr_code = relationship("QRCode", uselist=False, back_populates="asset", cascade="all, delete-orphan")
    documents = relationship("AssetDocument", back_populates="asset", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRequest", back_populates="asset", cascade="all, delete-orphan")
    transfers = relationship("TransferRequest", back_populates="asset", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="asset", cascade="all, delete-orphan")
    audit_results = relationship("AuditResult", back_populates="asset", cascade="all, delete-orphan")

class Warranty(Base, AuditMixin):
    __tablename__ = "warranties"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    details = Column(String(512), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="warranty")
    vendor = relationship("Vendor", back_populates="warranties")

class QRCode(Base, AuditMixin):
    __tablename__ = "qr_codes"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    code_string = Column(String(255), unique=True, nullable=False, index=True)
    qr_image_url = Column(String(255), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="qr_code")

class AssetDocument(Base, AuditMixin):
    __tablename__ = "asset_documents"
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="documents")

class SystemSetting(Base, AuditMixin):
    __tablename__ = "system_settings"
    
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(255), nullable=False)
