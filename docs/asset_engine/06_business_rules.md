# Business Rules & Lifecycle: Asset Management Engine

This document outlines the state transition logic, validation parameters, and business rules for the **Asset Management Engine** of **AssetFlow ERP**.

---

## 1. Asset Lifecycle State Transition Matrix

The engine manages asset status transitions systematically. Invalid or unauthorized status updates are rejected.

| Current Status | Target Status | Transition Type | Validation / Requirement |
| :--- | :--- | :--- | :--- |
| **`available`** | `allocated` | Allocation | Requires active employee assignment. |
| **`available`** | `reserved` | Booking | Requires active scheduling reservation. |
| **`available`** | `maintenance`| Repair Dispatch | Requires active maintenance ticket. |
| **`available`** | `retired` | Disposal | Requires administrator role approval. |
| **`allocated`** | `available` | Return | Confirms physical return of the asset. |
| **`allocated`** | `maintenance`| Repair Dispatch | Updates parent asset status to maintenance. |
| **`allocated`** | `lost` | Audit Flag | Triggered if asset is missing during an audit. |
| **`maintenance`**| `available` | Repair Completed| Enforces entry of repair cost and notes. |
| **`lost`** | `available` | Reconciliation| Auditor verifies asset presence and condition. |
| **`lost`** | `retired` | Write-off | Requires administrator sign-off. |
| **`retired`** | `disposed` | Final disposal | Enforces entry of disposal documentation. |
| **`disposed`** | Any | Blocked | Terminal state. No transitions allowed. |

---

## 2. Logical Business Rules & Constraints

### BR-AS-01: Serial Number Uniqueness
*   **Rule**: No two assets in the database can share the same manufacturer serial number.
*   **Enforcement**: Database-level unique constraint (`uq_assets_serial_number`).

### BR-AS-02: Allocation Restriction for Non-Available Assets
*   **Rule**: Assets marked as `lost`, `retired`, `disposed`, or `maintenance` cannot be allocated to employees.
*   **Enforcement**: Checked by the allocation service before creating a assignment record.

### BR-AS-03: No Deletion of Allocated Assets
*   **Rule**: An asset cannot be retired, soft-deleted, or deleted while it has an active allocation (where `returned_at` is null).
*   **Enforcement**: The service layer checks for active allocations before processing delete or status change requests.

### BR-AS-04: Read-Only Retired Assets
*   **Rule**: Once an asset transitions to the `retired` or `disposed` status, all its metadata, cost records, and historical logs become read-only and cannot be modified.
*   **Enforcement**: Checked by the update service before applying metadata changes.

### BR-AS-05: Maintenance Status Isolation
*   **Rule**: Assets in the `maintenance` status cannot be transferred to another location or allocated to an employee.
*   **Enforcement**: Checked by the transfer and allocation services.
