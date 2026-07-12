# Domain Modeling: AssetFlow ERP

This document contains the detailed domain models for the core business entities in **AssetFlow ERP**.

---

## 1. Domain Entities & Schemas

---

### 1.1 Department
*   **Purpose**: Represents organizational divisions within the enterprise.
*   **Attributes**:
    *   `id`: UUID (Primary Key, default: `gen_random_uuid()`)
    *   `name`: VARCHAR(100) (Unique, Not Null)
    *   `code`: VARCHAR(20) (Unique, Not Null)
    *   `head_id`: UUID (Foreign Key -> Employee, Nullable)
    *   `created_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
*   **Relationships**: 
    *   One-to-Many to Employees.
    *   One-to-Many to Locations.
*   **Lifecycle**: Active -> Merged -> Inactive.
*   **Business Rules**: Each active department must have an assigned Head of Department (Employee) to approve internal asset transfers and allocations.
*   **Validation Rules**: 
    *   `name` must be between 3 and 100 characters.
    *   `code` must match the format `^DEPT-[A-Z]{3,4}$`.
*   **Future Scalability**: Supports parent-child hierarchies (e.g., Sub-Departments) for large corporate structures.

---

### 1.2 Employee
*   **Purpose**: System users and targets for asset allocation.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `email`: VARCHAR(255) (Unique, Not Null)
    *   `full_name`: VARCHAR(255) (Not Null)
    *   `department_id`: UUID (Foreign Key -> Department, Not Null)
    *   `status`: VARCHAR(50) (Default: 'active', check constraint: 'active', 'suspended', 'terminated')
    *   `created_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
*   **Relationships**: 
    *   Belongs to Department.
    *   Has many Allocations.
    *   Has many Bookings.
*   **Lifecycle**: Onboarded -> Active -> Suspended -> Terminated.
*   **Business Rules**: Terminated employees cannot receive new allocations. All allocated assets must be returned or reassigned before status shifts to "terminated".
*   **Validation Rules**: `email` must be a valid RFC 5322 address.
*   **Future Scalability**: Automated user provisioning sync from Azure AD or LDAP services.

---

### 1.3 Role
*   **Purpose**: Logical authorization role definition.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(50) (Unique, Not Null, e.g., 'admin', 'manager', 'accountant', 'viewer')
    *   `description`: VARCHAR(255)
*   **Relationships**: Many-to-Many with Permissions.
*   **Lifecycle**: Static definitions.
*   **Business Rules**: System must prevent the removal or demotion of the last active "admin" role holder.
*   **Validation Rules**: Name must be lowercase with no special characters or spaces.

---

### 1.4 Permission
*   **Purpose**: Granular action authorization flags.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `code`: VARCHAR(100) (Unique, Not Null, e.g., 'asset:create', 'finance:calculate')
    *   `description`: VARCHAR(255)
*   **Relationships**: Belongs to Roles.
*   **Lifecycle**: Static system mappings.

---

### 1.5 Asset
*   **Purpose**: Physical or digital resources owned by the organization.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(255) (Not Null)
    *   `serial_number`: VARCHAR(100) (Unique, Not Null, Indexed)
    *   `category_id`: UUID (Foreign Key -> Asset Category, Not Null)
    *   `purchase_cost`: NUMERIC(15, 2) (Not Null)
    *   `purchase_date`: DATE (Not Null)
    *   `salvage_value`: NUMERIC(15, 2) (Default: 0.00)
    *   `useful_life_years`: INTEGER (Not Null)
    *   `status`: VARCHAR(50) (Default: 'available', check: 'available', 'allocated', 'maintenance', 'retired', 'lost')
    *   `condition`: VARCHAR(50) (Default: 'excellent', check: 'excellent', 'good', 'fair', 'damaged')
*   **Relationships**: 
    *   Belongs to Category.
    *   Has many Allocations.
    *   Has many Maintenance runs.
    *   Has many Audits.
*   **Lifecycle**: Draft -> Registered (Available) -> Allocated -> Maintenance -> Retired (or Lost).
*   **Business Rules**: `salvage_value` cannot exceed `purchase_cost`. Retired or lost assets cannot be allocated or booked.
*   **Validation Rules**: 
    *   `purchase_cost` must be > 0.00.
    *   `useful_life_years` must be between 1 and 50.
*   **Future Scalability**: JSONB field support for category-specific attributes (e.g., processor cores for server blades, battery health for laptops).

---

### 1.6 Asset Category
*   **Purpose**: Defines asset categories and default depreciation parameters.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(100) (Unique, Not Null)
    *   `depreciation_method`: VARCHAR(50) (Not Null, check: 'straight_line', 'double_declining')
    *   `default_useful_life`: INTEGER (Not Null)
*   **Relationships**: Has many Assets.
*   **Lifecycle**: Active -> Archived.

---

### 1.7 Maintenance
*   **Purpose**: Tracks service, calibration, and repair tasks on assets.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Not Null)
    *   `technician_id`: UUID (Foreign Key -> Employee/Technician, Not Null)
    *   `start_date`: TIMESTAMP WITH TIME ZONE (Not Null)
    *   `end_date`: TIMESTAMP WITH TIME ZONE (Nullable)
    *   `cost`: NUMERIC(15, 2) (Default: 0.00)
    *   `notes`: TEXT
    *   `status`: VARCHAR(50) (Default: 'scheduled', check: 'scheduled', 'in_progress', 'completed', 'cancelled')
*   **Relationships**: 
    *   Belongs to Asset.
    *   Belongs to Technician.
*   **Lifecycle**: Scheduled -> In Progress -> Completed (or Cancelled).
*   **Business Rules**: Maintenance tasks exceeding $1,000 require manager approval before transition to "in_progress".
*   **Validation Rules**: `end_date` must be >= `start_date`.

---

### 1.8 Booking
*   **Purpose**: Temporary scheduling of shared resources (vehicles, meeting rooms, portable test equipment).
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Not Null)
    *   `employee_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `start_time`: TIMESTAMP WITH TIME ZONE (Not Null)
    *   `end_time`: TIMESTAMP WITH TIME ZONE (Not Null)
    *   `status`: VARCHAR(50) (Default: 'requested', check: 'requested', 'confirmed', 'cancelled')
*   **Relationships**: 
    *   Belongs to Asset.
    *   Belongs to Employee.
*   **Lifecycle**: Requested -> Confirmed -> Active -> Completed (or Cancelled).
*   **Business Rules**: Overlapping bookings of the same asset are blocked at the database layer.

---

### 1.9 Transfer
*   **Purpose**: Logs transitions of assets between physical locations or departments.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Not Null)
    *   `source_location_id`: UUID (Foreign Key -> Location, Not Null)
    *   `target_location_id`: UUID (Foreign Key -> Location, Not Null)
    *   `requested_by`: UUID (Foreign Key -> Employee, Not Null)
    *   `approved_by`: UUID (Foreign Key -> Employee, Nullable)
    *   `status`: VARCHAR(50) (Default: 'pending', check: 'pending', 'approved', 'rejected')
*   **Relationships**: 
    *   Belongs to Asset.
    *   Belongs to source/target Locations.
*   **Lifecycle**: Pending -> Approved (or Rejected).

---

### 1.10 Allocation
*   **Purpose**: Documents long-term assignments of assets to employees.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Not Null)
    *   `employee_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `allocated_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
    *   `returned_at`: TIMESTAMP WITH TIME ZONE (Nullable)
*   **Relationships**: 
    *   Belongs to Asset.
    *   Belongs to Employee.
*   **Lifecycle**: Active -> Returned.
*   **Business Rules**: An asset cannot have more than one active allocation (where `returned_at` is null) at any time.

---

### 1.11 Audit
*   **Purpose**: Registers compliance audit cycles.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `scheduled_date`: DATE (Not Null)
    *   `completed_date`: DATE (Nullable)
    *   `auditor_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `status`: VARCHAR(50) (Default: 'scheduled', check: 'scheduled', 'in_progress', 'completed')
*   **Relationships**: Has many Audit Lines.
*   **Lifecycle**: Scheduled -> In Progress -> Completed.

---

### 1.12 Notification
*   **Purpose**: User alerts for pending actions, allocations, or status changes.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `recipient_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `title`: VARCHAR(255) (Not Null)
    *   `message`: TEXT (Not Null)
    *   `is_read`: BOOLEAN (Default: false)
    *   `created_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
*   **Relationships**: Belongs to Employee.

---

### 1.13 Activity Log
*   **Purpose**: Immutable transaction records for compliance audit trails.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `user_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `action`: VARCHAR(100) (Not Null)
    *   `payload`: JSONB (Stores before/after state details)
    *   `ip_address`: VARCHAR(45)
    *   `created_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
*   **Relationships**: Belongs to Employee.
*   **Business Rules**: Update and delete queries on this table are blocked at the database level.

---

### 1.14 QR Code
*   **Purpose**: Unique scanning link maps.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Unique, Not Null)
    *   `code_string`: VARCHAR(255) (Unique, Not Null)
    *   `image_url`: VARCHAR(512)
*   **Relationships**: Belongs to Asset.

---

### 1.15 Document
*   **Purpose**: Financial, lease, or acquisition contract records.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `title`: VARCHAR(255) (Not Null)
    *   `doc_type`: VARCHAR(50) (check: 'invoice', 'lease', 'contract', 'disposal')
    *   `file_path`: VARCHAR(512) (Not Null)

---

### 1.16 Attachment
*   **Purpose**: Attaches invoices or manuals to Assets or Maintenance runs.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `entity_type`: VARCHAR(50) (Not Null)
    *   `entity_id`: UUID (Not Null)
    *   `file_url`: VARCHAR(512) (Not Null)
    *   `uploaded_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)

---

### 1.17 Location
*   **Purpose**: Physical offices, warehouses, or server racks.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(100) (Unique, Not Null)
    *   `address`: VARCHAR(255) (Not Null)
    *   `location_type`: VARCHAR(50) (check: 'office', 'warehouse', 'datacenter', 'site')

---

### 1.18 Condition
*   **Purpose**: Physical status records over time.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Not Null)
    *   `condition_state`: VARCHAR(50) (Not Null, check: 'excellent', 'good', 'fair', 'damaged')
    *   `reported_at`: TIMESTAMP WITH TIME ZONE (Default: `now()`)
    *   `reported_by`: UUID (Foreign Key -> Employee, Not Null)

---

### 1.19 Vendor
*   **Purpose**: Third-party suppliers and maintenance services.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(255) (Not Null)
    *   `contact_email`: VARCHAR(255)
    *   `support_phone`: VARCHAR(50)

---

### 1.20 Warranty
*   **Purpose**: Tracks coverage timelines and terms for assets.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `asset_id`: UUID (Foreign Key -> Asset, Unique, Not Null)
    *   `start_date`: DATE (Not Null)
    *   `end_date`: DATE (Not Null)
    *   `coverage_details`: TEXT

---

### 1.21 Status
*   **Purpose**: Represents configuration states.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(50) (Unique, Not Null)
    *   `description`: VARCHAR(255)

---

### 1.22 Approval
*   **Purpose**: Approvals checklist for transfers, purchases, or retirements.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `approval_type`: VARCHAR(50) (Not Null)
    *   `entity_id`: UUID (Not Null)
    *   `status`: VARCHAR(50) (Default: 'pending', check: 'pending', 'approved', 'rejected')
    *   `approver_id`: UUID (Foreign Key -> Employee, Not Null)
    *   `notes`: TEXT
    *   `actioned_at`: TIMESTAMP WITH TIME ZONE (Nullable)

---

### 1.23 Technician
*   **Purpose**: Employees certified to perform repairs.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `employee_id`: UUID (Foreign Key -> Employee, Unique, Not Null)
    *   `specialty`: VARCHAR(100)
    *   `is_available`: BOOLEAN (Default: true)

---

### 1.24 Calendar Event
*   **Purpose**: Event tracking for schedules (e.g., audit cycles).
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `title`: VARCHAR(255) (Not Null)
    *   `start_time`: TIMESTAMP WITH TIME ZONE (Not Null)
    *   `end_time`: TIMESTAMP WITH TIME ZONE (Not Null)
    *   `event_type`: VARCHAR(50) (check: 'maintenance', 'audit', 'booking')

---

### 1.25 Resource
*   **Purpose**: Logistics capacity tracking.
*   **Attributes**:
    *   `id`: UUID (Primary Key)
    *   `name`: VARCHAR(100) (Not Null)
    *   `resource_type`: VARCHAR(50)
    *   `capacity`: NUMERIC(10, 2)
