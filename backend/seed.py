import sys
import os
from datetime import date
from uuid import UUID

# Filter out bare home directory from search path to prevent namespace clash
sys.path = [p for p in sys.path if p.rstrip("\\/").lower() != "c:\\users\\lenovo"]

# Insert local path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
# Import all models to register them with the declarative base metadata
from app.models.user import User
from app.models.org import Department, Employee, Location, Vendor
from app.models.asset import AssetCategory, Asset, Warranty, QRCode, AssetDocument, SystemSetting
from app.models.operations import AssetAllocation, TransferRequest, Booking, Maintenance
from app.models.audit import AuditCycle, AuditResult
from app.models.log import Notification, ActivityLog

def seed_database():
    db = SessionLocal()
    try:
        print("Starting database seeding...")

        # 1. Seed Location
        loc = db.query(Location).filter(Location.code == "HQ-01").first()
        if not loc:
            loc = Location(
                name="HQ Main Office",
                code="HQ-01",
                address="123 Enterprise Way, Silicon Valley"
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
            print(f"Created location: {loc.name}")
        else:
            print("Location HQ-01 already exists.")

        # 2. Seed Asset Category
        cat = db.query(AssetCategory).filter(AssetCategory.name == "Electronics").first()
        if not cat:
            cat = AssetCategory(
                name="Electronics",
                description="Workspace screens, switchers, and projectors"
            )
            db.add(cat)
            db.commit()
            db.refresh(cat)
            print(f"Created category: {cat.name}")
        else:
            print("Category Electronics already exists.")

        # 3. Seed Department
        dept = db.query(Department).filter(Department.code == "ENG").first()
        if not dept:
            dept = Department(
                name="Engineering Division",
                code="ENG"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"Created department: {dept.name}")
        else:
            print("Department ENG already exists.")

        # 4. Seed Employee (ID matching the frontend mock session UUID)
        emp_uuid = UUID("c1a60fae-e2c7-4ebc-8854-3252199b0c20")
        emp = db.query(Employee).filter(Employee.id == emp_uuid).first()
        if not emp:
            emp = Employee(
                id=emp_uuid,
                first_name="System",
                last_name="Administrator",
                employee_code="EMP-001",
                email="admin@example.com",
                phone="555-0199",
                department_id=dept.id
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)
            print(f"Created employee: {emp.first_name} {emp.last_name}")
        else:
            print("Employee EMP-001 already exists.")

        # 5. Seed Assets (with matching client dropdown UUIDs)
        assets_to_seed = [
            {
                "id": UUID("550e8400-e29b-41d4-a716-446655440000"),
                "name": "HQ Boardroom Projector",
                "serial_number": "SN-PRJ-9021"
            },
            {
                "id": UUID("550e8400-e29b-41d4-a716-446655440001"),
                "name": "Conference Speakerphone",
                "serial_number": "SN-SPK-3382"
            },
            {
                "id": UUID("550e8400-e29b-41d4-a716-446655440002"),
                "name": "Dell UltraSharp 32 Monitor",
                "serial_number": "SN-DEL-0019"
            }
        ]

        for item in assets_to_seed:
            asset = db.query(Asset).filter(Asset.id == item["id"]).first()
            if not asset:
                asset = Asset(
                    id=item["id"],
                    name=item["name"],
                    serial_number=item["serial_number"],
                    category_id=cat.id,
                    purchase_cost=1200.00,
                    purchase_date=date.today(),
                    salvage_value=150.00,
                    useful_life_years=5,
                    location_id=loc.id
                )
                asset.status = "available"
                db.add(asset)
                print(f"Created asset: {asset.name}")
        
        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
