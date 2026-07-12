# User Journeys: AssetFlow ERP

This document maps out the system from the perspective of our primary user personas. It details their daily challenges, data requirements, actions, permissions, potential mistakes, and systematic preventions.

---

## 1. User Roles Persona Analysis

---

### 1.1 Admin (System Administrator)
*   **Daily Problems**: Managing user accounts, correcting permission mismatches, troubleshooting integration errors with Active Directory, reviewing security logs.
*   **Information Needed**: System status dashboard, failed login logs, user role matrices, API audit logs.
*   **Actions**:
    *   Creates/deletes users and overrides roles.
    *   Manages system parameters (e.g., configuring CORS, modifying email templates).
    *   Triggers system backups.
*   **Permissions**: `USER_CREATE`, `USER_EDIT`, `SYSTEM_CONFIG`, `OVERRIDE_LOCKS`, `VIEW_SECURITY_LOGS`.
*   **Mistakes**: 
    1.  Accidentally demoting the last active Administrator.
    2.  Escalating a regular employee to Admin status without double-authorization.
*   **System Preventions**:
    *   The database blocks deleting or demoting the final `admin` user.
    *   Role changes require password re-verification and log an entry in the audit trail.

---

### 1.2 Asset Manager
*   **Daily Problems**: Manually labeling incoming machinery, matching physical inventory to records, tracking missing assets, managing asset returns.
*   **Information Needed**: Real-time asset inventory levels, pending transfer requests, list of assets categorized by condition.
*   **Actions**:
    *   Registers new physical assets.
    *   Initiates asset transfers and returns.
    *   Generates QR code print sheets.
*   **Permissions**: `ASSET_CREATE`, `ASSET_EDIT`, `ASSET_TRANSFER_INITIATE`, `GENERATE_QR`.
*   **Mistakes**:
    1.  Inputting duplicate manufacturer serial numbers.
    2.  Allocating an asset to an employee who has left the company.
*   **System Preventions**:
    *   Serial numbers are checked for uniqueness before saving.
    *   The allocation dropdown filters out terminated or suspended employees.

---

### 1.3 Department Head
*   **Daily Problems**: Reviewing and approving asset allocations for their team, tracking equipment expenses against department budget limits.
*   **Information Needed**: Asset lists for their department, pending approval queues, asset cost logs.
*   **Actions**:
    *   Approves or rejects department asset transfers.
    *   Requests additional assets for team members.
*   **Permissions**: `DEPARTMENT_ASSETS_READ`, `TRANSFER_APPROVE_INTERNAL`, `BUDGET_READ`.
*   **Mistakes**: Approving transfers for assets that do not belong to their department.
*   **System Preventions**: The system filters their approval list to show only transfers involving their department's assets.

---

### 1.4 Employee
*   **Daily Problems**: Finding available shared resources (meeting rooms, project devices), reporting broken equipment, requesting work laptops.
*   **Information Needed**: List of assets currently allocated to them, availability calendars for shared resources, status of their requests.
*   **Actions**:
    *   Requests asset allocation.
    *   Books shared resources.
    *   Submits damage/maintenance reports.
*   **Permissions**: `MY_ALLOCATIONS_READ`, `BOOK_RESOURCE`, `REPORT_DAMAGE`.
*   **Mistakes**:
    1.  Double-booking a vehicle for overlapping trips.
    2.  Forgetting to confirm return of an asset, keeping it allocated indefinitely.
*   **System Preventions**:
    *   Calendar checks block overlapping bookings.
    *   Automated email reminders are sent as the scheduled return date approaches.

---

### 1.5 Auditor
*   **Daily Problems**: Matching paper inventories against database records, verifying asset existence, checking historical valuation calculations.
*   **Information Needed**: Complete asset logs, transfer approvals, depreciation calculations, audit logs.
*   **Actions**:
    *   Creates scheduled audit verification sheets.
    *   Flags discrepancies between physical checks and database records.
*   **Permissions**: `COMPLETE_LEDGER_READ`, `AUDIT_EXECUTE`, `DISCREPANCY_FLAG`.
*   **Mistakes**: Accidentally modifying asset valuations or deleting ledger records.
*   **System Preventions**: The Auditor role has read-only access to core asset fields and cannot modify assets.

---

### 1.6 Technician
*   **Daily Problems**: Managing assigned maintenance tasks, ordering replacement parts, keeping track of repair times.
*   **Information Needed**: Maintenance schedule, asset history log, details on reported issues.
*   **Actions**:
    *   Starts and completes maintenance tasks.
    *   Logs repair costs and adds notes.
*   **Permissions**: `MAINTENANCE_UPDATE`, `MY_TASKS_READ`.
*   **Mistakes**: Closing a maintenance ticket as "completed" without entering repair notes or cost.
*   **System Preventions**: The system enforces mandatory text inputs in the `notes` and `cost` fields before a maintenance record status can transition to `completed`.

---

### 1.7 Organization Owner
*   **Daily Problems**: Tracking company value assets, reviewing CapEx spending, assessing asset utilization rates.
*   **Information Needed**: Executive summary dashboards, asset depreciation sheets, total value calculations.
*   **Actions**: Reads reports and reviews operational statistics.
*   **Permissions**: `DASHBOARD_READ`, `EXECUTIVE_REPORT_READ`.
*   **Mistakes**: Modifying active inventories or editing data tables.
*   **System Preventions**: The role has read-only dashboard access.
