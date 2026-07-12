# Enterprise Database Design & Schema Specification: AssetFlow ERP

This document contains the complete database design and PostgreSQL schema specifications for the **AssetFlow ERP** platform. All tables are designed to support ACID transactions, audit logging, soft deletes, and efficient querying.

---

## 1. Core Platform Tables

### 1.1 `users`
*   **Purpose**: Stores authentication credentials, status flags, and linking references for system users.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `email`: `VARCHAR(255)` (Not Null, Lowercase)
    *   `hashed_password`: `VARCHAR(255)` (Not Null)
    *   `role_id`: `UUID` (Foreign Key, Not Null)
    *   `employee_id`: `UUID` (Foreign Key, Nullable)
    *   `is_active`: `BOOLEAN` (Default: `true`)
    *   `failed_login_attempts`: `INTEGER` (Default: `0`)
    *   `locked_until`: `TIMESTAMP WITH TIME ZONE` (Nullable)
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
    *   `updated_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Unique Constraints**: `uq_users_email` ON (`email`)
*   **Check Constraints**: `chk_failed_attempts` CHECK (`failed_login_attempts >= 0`)
*   **Foreign Keys**:
    *   `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
    *   `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
*   **Index Strategy**:
    *   Unique Index on `email` (for login lookups).
    *   Index on `employee_id`.
*   **Future Expansion**: Support for multi-factor authentication (MFA) secret fields and OAuth provider strings.

---

### 1.2 `roles`
*   **Purpose**: System roles matrix definitions.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(50)` (Not Null)
    *   `description`: `VARCHAR(255)`
*   **Unique Constraints**: `uq_roles_name` ON (`name`)
*   **Index Strategy**: Unique Index on `name`.

---

### 1.3 `permissions`
*   **Purpose**: Granular permission definition flags.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `code`: `VARCHAR(100)` (Not Null)
    *   `description`: `VARCHAR(255)`
*   **Unique Constraints**: `uq_permissions_code` ON (`code`)
*   **Index Strategy**: Unique Index on `code`.

---

### 1.4 `role_permissions` (Implicit Join Table)
*   **Purpose**: Many-to-Many join table mapping permissions to roles.
*   **Columns & Types**:
    *   `role_id`: `UUID` (Primary Key Component)
    *   `permission_id`: `UUID` (Primary Key Component)
*   **Foreign Keys**:
    *   `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
    *   `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE

---

### 1.5 `departments`
*   **Purpose**: Organizational divisions.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(100)` (Not Null)
    *   `code`: `VARCHAR(20)` (Not Null)
    *   `head_id`: `UUID` (Foreign Key, Nullable)
    *   `is_active`: `BOOLEAN` (Default: `true`)
*   **Unique Constraints**: `uq_departments_code` ON (`code`), `uq_departments_name` ON (`name`)
*   **Foreign Keys**:
    *   `fk_departments_head` FOREIGN KEY (`head_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL

---

### 1.6 `department_hierarchy`
*   **Purpose**: Direct Parent-Child mapping for nested corporate divisions.
*   **Columns & Types**:
    *   `parent_id`: `UUID` (Foreign Key, Not Null)
    *   `child_id`: `UUID` (Foreign Key, Not Null, Primary Key)
*   **Foreign Keys**:
    *   `fk_dh_parent` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
    *   `fk_dh_child` FOREIGN KEY (`child_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE

---

### 1.7 `employees`
*   **Purpose**: Employee ledger and target assignees.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `email`: `VARCHAR(255)` (Not Null)
    *   `full_name`: `VARCHAR(255)` (Not Null)
    *   `department_id`: `UUID` (Foreign Key, Not Null)
    *   `status`: `VARCHAR(50)` (Default: `'active'`)
*   **Unique Constraints**: `uq_employees_email` ON (`email`)
*   **Check Constraints**: `chk_emp_status` CHECK (`status` IN ('active', 'suspended', 'terminated'))
*   **Foreign Keys**:
    *   `fk_employees_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT

---

## 2. Inventory & Asset Management Tables

### 2.8 `asset_categories`
*   **Purpose**: Group asset registries and hold default depreciation methods.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(100)` (Not Null)
    *   `depreciation_method`: `VARCHAR(50)` (Not Null)
    *   `default_useful_life`: `INTEGER` (Not Null)
*   **Unique Constraints**: `uq_categories_name` ON (`name`)
*   **Check Constraints**:
    *   `chk_depr_method` CHECK (`depreciation_method` IN ('straight_line', 'double_declining'))
    *   `chk_useful_life` CHECK (`default_useful_life >= 1`)

---

### 2.9 `assets`
*   **Purpose**: General ledger registry for individual corporate hardware, software, or property assets.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(255)` (Not Null)
    *   `serial_number`: `VARCHAR(100)` (Not Null)
    *   `category_id`: `UUID` (Foreign Key, Not Null)
    *   `purchase_cost`: `NUMERIC(15, 2)` (Not Null)
    *   `purchase_date`: `DATE` (Not Null)
    *   `salvage_value`: `NUMERIC(15, 2)` (Default: `0.00`)
    *   `useful_life_years`: `INTEGER` (Not Null)
    *   `status`: `VARCHAR(50)` (Default: `'available'`)
    *   `condition`: `VARCHAR(50)` (Default: `'excellent'`)
    *   `location_id`: `UUID` (Foreign Key, Not Null)
    *   `version`: `INTEGER` (Default: `1`) # For optimistic locking
*   **Unique Constraints**: `uq_assets_serial` ON (`serial_number`)
*   **Check Constraints**:
    *   `chk_salvage` CHECK (`salvage_value <= purchase_cost` AND `salvage_value >= 0`)
    *   `chk_cost` CHECK (`purchase_cost > 0`)
    *   `chk_life` CHECK (`useful_life_years >= 1`)
    *   `chk_status` CHECK (`status` IN ('available', 'allocated', 'maintenance', 'retired', 'lost'))
    *   `chk_condition` CHECK (`condition` IN ('excellent', 'good', 'fair', 'damaged'))
*   **Foreign Keys**:
    *   `fk_assets_category` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`) ON DELETE RESTRICT
    *   `fk_assets_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT

---

### 2.10 `asset_documents`
*   **Purpose**: Tracks links to legal agreements, purchase contracts, and certificates.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `title`: `VARCHAR(255)` (Not Null)
    *   `doc_type`: `VARCHAR(50)` (Not Null)
    *   `file_url`: `VARCHAR(512)` (Not Null)
*   **Foreign Keys**:
    *   `fk_docs_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE

---

### 2.11 `asset_images`
*   **Purpose**: Stores reference photos of assets, verifying condition states.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `image_url`: `VARCHAR(512)` (Not Null)
    *   `uploaded_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Foreign Keys**:
    *   `fk_images_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE

---

### 2.12 `asset_allocations`
*   **Purpose**: Records physical custody assignments of devices to employees.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `employee_id`: `UUID` (Foreign Key, Not Null)
    *   `allocated_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
    *   `returned_at`: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   **Foreign Keys**:
    *   `fk_allocations_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE RESTRICT
    *   `fk_allocations_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT

---

### 2.13 `transfer_requests`
*   **Purpose**: Approval workflow records for moving assets between departments or sites.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `source_location_id`: `UUID` (Foreign Key, Not Null)
    *   `target_location_id`: `UUID` (Foreign Key, Not Null)
    *   `requested_by`: `UUID` (Foreign Key, Not Null)
    *   `approved_by`: `UUID` (Foreign Key, Nullable)
    *   `status`: `VARCHAR(50)` (Default: `'pending'`)
    *   `notes`: `TEXT`
*   **Foreign Keys**:
    *   `fk_transfers_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE RESTRICT
    *   `fk_transfers_source` FOREIGN KEY (`source_location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT
    *   `fk_transfers_target` FOREIGN KEY (`target_location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT

---

### 2.14 `maintenance_requests`
*   **Purpose**: Log repair requests and ticket details.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `technician_id`: `UUID` (Foreign Key, Nullable)
    *   `issue_description`: `TEXT` (Not Null)
    *   `priority`: `VARCHAR(20)` (Default: `'medium'`)
    *   `status`: `VARCHAR(50)` (Default: `'pending'`)
*   **Foreign Keys**:
    *   `fk_maint_req_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE RESTRICT
    *   `fk_maint_req_tech` FOREIGN KEY (`technician_id`) REFERENCES `technicians` (`id`) ON DELETE SET NULL

---

### 2.15 `maintenance_history`
*   **Purpose**: Immutable log containing repair details and costs for compliance tracking.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `request_id`: `UUID` (Foreign Key, Not Null)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `cost`: `NUMERIC(15, 2)` (Not Null)
    *   `notes`: `TEXT` (Not Null)
    *   `completed_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Foreign Keys**:
    *   `fk_maint_hist_req` FOREIGN KEY (`request_id`) REFERENCES `maintenance_requests` (`id`) ON DELETE RESTRICT
    *   `fk_maint_hist_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE RESTRICT

---

### 2.16 `bookings`
*   **Purpose**: Handles temporary reservations of shared resource categories.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `employee_id`: `UUID` (Foreign Key, Not Null)
    *   `start_time`: `TIMESTAMP WITH TIME ZONE` (Not Null)
    *   `end_time`: `TIMESTAMP WITH TIME ZONE` (Not Null)
    *   `status`: `VARCHAR(50)` (Default: `'confirmed'`)
*   **Foreign Keys**:
    *   `fk_bookings_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE RESTRICT
    *   `fk_bookings_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT

---

### 2.17 `booking_resources`
*   **Purpose**: Capacity parameters for bookable spaces.
*   **Columns & Types**:
    *   `booking_id`: `UUID` (Foreign Key, Primary Key)
    *   `attendee_count`: `INTEGER` (Not Null)
*   **Foreign Keys**:
    *   `fk_br_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE

---

### 2.18 `audit_cycles`
*   **Purpose**: Identifies audit periods.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `title`: `VARCHAR(100)` (Not Null)
    *   `scheduled_start`: `DATE` (Not Null)
    *   `completed_at`: `TIMESTAMP WITH TIME ZONE` (Nullable)
    *   `status`: `VARCHAR(50)` (Default: `'scheduled'`)

---

### 2.19 `audit_results`
*   **Purpose**: Logged scans and audits for individual assets.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `cycle_id`: `UUID` (Foreign Key, Not Null)
    *   `asset_id`: `UUID` (Foreign Key, Not Null)
    *   `auditor_id`: `UUID` (Foreign Key, Not Null)
    *   `scanned_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
    *   `verified_condition`: `VARCHAR(50)` (Not Null)
    *   `is_present`: `BOOLEAN` (Default: `true`)
*   **Foreign Keys**:
    *   `fk_results_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `audit_cycles` (`id`) ON DELETE CASCADE
    *   `fk_results_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
    *   `fk_results_auditor` FOREIGN KEY (`auditor_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT

---

### 2.20 `discrepancy_reports`
*   **Purpose**: Flags discrepancy tickets when an audited asset is missing or damaged.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `audit_result_id`: `UUID` (Foreign Key, Not Null, Unique)
    *   `discrepancy_type`: `VARCHAR(50)` (Not Null, check: 'missing', 'damaged', 'unauthorized_location')
    *   `severity`: `VARCHAR(20)` (Default: `'medium'`)
    *   `resolved_at`: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   **Foreign Keys**:
    *   `fk_discrepancy_result` FOREIGN KEY (`audit_result_id`) REFERENCES `audit_results` (`id`) ON DELETE CASCADE

---

### 2.21 `notifications`
*   **Purpose**: System alerts and messages queue.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `recipient_id`: `UUID` (Foreign Key, Not Null)
    *   `title`: `VARCHAR(255)` (Not Null)
    *   `message`: `TEXT` (Not Null)
    *   `is_read`: `BOOLEAN` (Default: `false`)
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Foreign Keys**:
    *   `fk_notifications_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE

---

### 2.22 `activity_logs`
*   **Purpose**: Immutable ledger recording all data changes for audit trails.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `user_id`: `UUID` (Foreign Key, Not Null)
    *   `action`: `VARCHAR(100)` (Not Null)
    *   `table_name`: `VARCHAR(100)` (Not Null)
    *   `row_id`: `UUID` (Not Null)
    *   `payload`: `JSONB`
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Foreign Keys**:
    *   `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT

---

### 2.23 `qr_codes`
*   **Purpose**: QR tracking strings.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Unique, Not Null)
    *   `code_string`: `VARCHAR(255)` (Unique, Not Null)
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
*   **Foreign Keys**:
    *   `fk_qr_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE

---

### 2.24 `locations`
*   **Purpose**: Target places list.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(100)` (Unique, Not Null)
    *   `address`: `VARCHAR(255)` (Not Null)
    *   `location_type`: `VARCHAR(50)` (Not Null)

---

### 2.25 `vendors`
*   **Purpose**: Supplier contacts list.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `name`: `VARCHAR(255)` (Not Null)
    *   `contact_email`: `VARCHAR(255)`

---

### 2.26 `warranties`
*   **Purpose**: Asset warranty timelines.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `asset_id`: `UUID` (Foreign Key, Unique, Not Null)
    *   `end_date`: `DATE` (Not Null)
    *   `coverage_notes`: `TEXT`
*   **Foreign Keys**:
    *   `fk_warranties_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE

---

### 2.27 `technicians`
*   **Purpose**: Specialized repair staff references.
*   **Columns & Types**:
    *   `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
    *   `employee_id`: `UUID` (Foreign Key, Unique, Not Null)
    *   `specialty`: `VARCHAR(100)`
*   **Foreign Keys**:
    *   `fk_tech_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE

---

### 2.28 `settings`
*   **Purpose**: Global system configurations table.
*   **Columns & Types**:
    *   `key`: `VARCHAR(100)` (Primary Key)
    *   `value`: `TEXT` (Not Null)
    *   `description`: `VARCHAR(255)`
