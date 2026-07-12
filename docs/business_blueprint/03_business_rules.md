# Business Rules: AssetFlow ERP

This document contains the logical business rules, validation constraints, and database-level rules that govern the **AssetFlow ERP** system.

---

## 1. Asset Inventory & Registration Rules

### BR-AS-01: Manufacturer Serial Number Uniqueness
*   **Definition**: No two assets in the database can share the same manufacturer serial number.
*   **Enforcement**: Handled via a unique index constraint (`idx_assets_serial_number`) on the `assets` table. Duplicate submissions are rejected with an `HTTP 409 Conflict` error.

### BR-AS-02: Allocation Exclusivity
*   **Definition**: An asset cannot be allocated to two employees simultaneously.
*   **Enforcement**: A new allocation record can only be created if all existing allocation records for the target `asset_id` have a non-null `returned_at` timestamp.

### BR-AS-03: No Retirement of Active Allocations
*   **Definition**: An asset cannot transition to a status of "retired", "lost", or "disposed" if it is currently allocated (has an active allocation where `returned_at` is null).
*   **Enforcement**: The service layer checks active allocations prior to executing status changes. Attempts trigger a validation error.

### BR-AS-04: Salvage Value Boundary
*   **Definition**: The salvage value of any asset cannot exceed its original purchase cost.
*   **Enforcement**: Enforced during asset registration and updates: `assert purchase_cost >= salvage_value`.

---

## 2. Resource Booking Rules

### BR-BK-01: Overlapping Booking Prevention
*   **Definition**: Shared resource assets (vehicles, mobile tools, meeting rooms) cannot be booked for overlapping time windows.
*   **Enforcement**: Handled via a PostgreSQL exclusion constraint:
    ```sql
    ALTER TABLE bookings ADD CONSTRAINT prevent_booking_overlap 
    EXCLUDE USING gist (asset_id WITH =, tsrange(start_time, end_time) WITH &&);
    ```

### BR-BK-02: Self-Booking Limits
*   **Definition**: Regular employees can have a maximum of **3 active bookings** scheduled in the future at any one time.
*   **Enforcement**: Checked by the booking service before accepting a new request.

---

## 3. Maintenance Rules

### BR-MT-01: Cost-Based Maintenance Approvals
*   **Definition**: Preventive or corrective maintenance operations exceeding a cost of **$1,000** cannot transition from "scheduled" to "in_progress" without prior Department Head or Manager approval.
*   **Enforcement**: The status transition is blocked until a matching approved `Approval` record is linked to the maintenance record.

### BR-MT-02: Status Isolation During Maintenance
*   **Definition**: When an asset's maintenance record status becomes "in_progress", the parent asset status must be automatically set to "maintenance". While in this state, the asset is excluded from search listings for bookings and allocations.
*   **Enforcement**: Managed via an atomic database transaction within the Maintenance Service layer.

---

## 4. Transfers & Approvals

### BR-TR-01: Inter-Departmental Transfer Approvals
*   **Definition**: Moving an asset from one department's location to another requires approvals from both the source Department Head (releasing the asset) and target Department Head (accepting the asset).
*   **Enforcement**: Two-step approval verification workflow. The asset location remains unchanged until both approval flags are registered.

### BR-TR-02: Self-Approval Prevention
*   **Definition**: An employee cannot approve their own asset transfer requests, allocations, or maintenance sign-offs.
*   **Enforcement**: Checked at the service level: `assert requester_id != approver_id`.

---

## 5. Security & Isolation Boundaries

### BR-SE-01: Admin Account Minimum
*   **Definition**: The system must prevent deletion or role demotion of the last active "admin" user.
*   **Enforcement**: Checked by the User Service layer during update/delete actions.

### BR-SE-02: Department Isolation Boundary
*   **Definition**: Department Heads and Managers can only view, edit, and approve asset transfers for employees belonging to their own department, unless granted a cross-department permission flag.
*   **Enforcement**: FastAPI routers enforce filters on queries using the authenticated user's `department_id`.
