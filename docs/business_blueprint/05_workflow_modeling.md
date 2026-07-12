# Workflow Modeling: AssetFlow ERP

This document maps out the procedural steps, validation checks, decisions, exceptions, and recovery models for all core workflows in **AssetFlow ERP**.

---

## 1. Asset Registration Workflow

```
[Start] ──> [Validate Serial Number] ──(Exists)──> [Error: Duplicate serial]
   │
 (Unique)
   ▼
[Check Category ID] ──(Invalid)──> [Error: Category Not Found]
   │
 (Valid)
   ▼
[Create Asset Record] ──> [Generate QR Code Metadata] ──> [Completion]
```

*   **Start**: User submits the Asset registration form (fields: Name, Serial Number, Category ID, Purchase Cost, Purchase Date).
*   **Validation**: 
    1. Check if `serial_number` is already registered.
    2. Confirm that `category_id` exists in the database.
    3. Verify that `purchase_cost` is greater than or equal to `salvage_value`.
*   **Decision Points**:
    *   If validation passes, proceed to save.
    *   If validation fails, return a `400 Bad Request` or `409 Conflict`.
*   **Exception Cases**: The category uses Straight-Line depreciation, but Useful Life is set to 0.
*   **Error Recovery**: The system prompts the user to correct the input fields and resubmit.
*   **Completion**: The asset is saved with a status of "available", an initial depreciation schedule is created, and the unique QR code metadata is generated.

---

## 2. Asset Allocation Workflow

*   **Start**: An Asset Manager assigns an asset to an Employee.
*   **Validation**: 
    1. Confirm that the asset's current status is "available".
    2. Confirm that the target employee's status is "active".
*   **Decision Points**:
    *   Is the asset available and not assigned elsewhere? If yes, proceed.
    *   If the asset is in maintenance, retired, or already allocated, block the request.
*   **Exception Cases**: The employee has not returned previously assigned assets that are now overdue.
*   **Error Recovery**: Alert the manager with a list of the employee's overdue assets before allowing them to proceed with the override allocation.
*   **Completion**: The asset status is updated to "allocated", a new `Allocation` record is created, and an email notification is sent to the employee.

---

## 3. Asset Return Workflow

*   **Start**: Employee returns an allocated asset.
*   **Validation**: Verify that an active allocation record exists for the asset and employee.
*   **Decision Points**:
    *   Is the asset returned in good condition?
        *   *Yes*: Close the allocation record and update the asset status to "available".
        *   *No (Damaged)*: Trigger the Maintenance and Repair workflow.
*   **Exception Cases**: The asset is returned by a different employee than the one it was allocated to.
*   **Error Recovery**: Log the discrepancy, close the original allocation, and require the manager to confirm the identity of the person returning the item.
*   **Completion**: The active allocation is closed by updating `returned_at` to the current timestamp.

---

## 4. Transfer Request Workflow

*   **Start**: An employee requests to move an asset from Location A to Location B.
*   **Validation**: Confirm the asset is currently allocated or available, and that both the source and target locations are active.
*   **Decision Points**:
    *   Does the transfer involve different departments?
        *   *Yes*: Route requests to both Department Heads for approval.
        *   *No*: Automatically approve the transfer.
*   **Exception Cases**: The target location is full or inactive.
*   **Error Recovery**: The system blocks the transfer request and displays a "Location Capacity Exceeded" error.
*   **Completion**: Both department heads approve the transfer, the asset's location is updated, and the transfer log is closed.

---

## 5. Maintenance Workflow

*   **Start**: An asset is reported as damaged, or a scheduled maintenance interval is reached.
*   **Validation**: Verify the asset is not currently retired or lost.
*   **Decision Points**:
    *   Does the estimated repair cost exceed $1,000?
        *   *Yes*: Create an approval request for the Department Head.
        *   *No*: Automatically authorize the maintenance task.
*   **Exception Cases**: No technicians with the required specialty are currently available.
*   **Error Recovery**: Queue the maintenance task as "scheduled" and notify the maintenance coordinator to assign an external vendor.
*   **Completion**: The technician performs the repairs, logs the actual cost and notes, and updates the asset status back to "available".

---

## 6. Booking Workflow

*   **Start**: An employee requests to book a shared asset (e.g., a pool vehicle) for a specific time range.
*   **Validation**: 
    1. Check for scheduling conflicts with existing bookings.
    2. Verify the asset status is "available".
*   **Decision Points**:
    *   Does the requested time overlap with an existing booking? If no, proceed.
    *   If yes, block the booking.
*   **Exception Cases**: The asset is placed in maintenance before the booking starts.
*   **Error Recovery**: Cancel the booking, notify the user via email, and suggest alternative assets in the same category.
*   **Completion**: The booking status is updated to "confirmed", blocking other requests for that time slot.

---

## 7. Audit Cycle Workflow

*   **Start**: An administrator schedules a physical inventory audit.
*   **Validation**: Verify that the selected auditor has the required access permissions.
*   **Decision Points**:
    *   Does the auditor verify all assets without discrepancies?
        *   *Yes*: Close the audit.
        *   *No*: Log discrepancies (e.g., condition changes, missing items) and flag the assets for review.
*   **Exception Cases**: An asset cannot be physically located during the audit.
*   **Error Recovery**: Set the asset status to "lost" and trigger the Lost Asset Recovery workflow, which requires manager sign-off.
*   **Completion**: The audit record is signed, updating its status to "completed" and locking the audit log.

---

## 8. Employee Registration Workflow

*   **Start**: HR creates a new employee profile.
*   **Validation**: Verify that the email address is unique and belongs to the corporate domain.
*   **Decision Points**:
    *   Does the assigned department ID exist? If yes, proceed.
    *   If no, reject the registration.
*   **Exception Cases**: The employee's email is already registered to an inactive account.
*   **Error Recovery**: Reactivate the existing account rather than creating a duplicate record.
*   **Completion**: The employee record is created, and an onboarding email containing login instructions is sent.

---

## 9. Role Promotion Workflow

*   **Start**: An administrator requests to change an employee's role (e.g., from Viewer to Accountant).
*   **Validation**: Confirm the target role exists and the requester has admin permissions.
*   **Decision Points**:
    *   Does the promotion grant admin permissions?
        *   *Yes*: Require a second administrator to approve the change.
        *   *No*: Process the promotion immediately.
*   **Exception Cases**: The requester is the only active administrator.
*   **Error Recovery**: Block self-promotion attempts and return a "Self-promotion forbidden" validation error.
*   **Completion**: The user's role is updated, and the change is logged in the system audit trail.

---

## 10. Notifications Workflow

*   **Start**: A system event (e.g., transfer request, audit scheduled) triggers a notification.
*   **Validation**: Verify the recipient's email is active and their notification settings allow the alert.
*   **Decision Points**:
    *   Is the notification urgent?
        *   *Yes*: Send both an in-app alert and an email notification.
        *   *No*: Queue the alert for a daily email digest.
*   **Exception Cases**: The email server is down or unreachable.
*   **Error Recovery**: Retry sending the email up to 3 times before logging the failure. The in-app notification remains unaffected.
*   **Completion**: The notification is delivered to the recipient's in-app inbox.

---

## 11. Approvals Workflow

*   **Start**: A request requiring approval (e.g., transfer, high-cost maintenance) is created.
*   **Validation**: Confirm the request has a valid approver assigned.
*   **Decision Points**:
    *   Does the approver approve the request?
        *   *Yes*: Execute the requested action (e.g., transfer the asset) and update status.
        *   *No*: Log the rejection reason and notify the requester.
*   **Exception Cases**: The approver does not respond within 48 hours.
*   **Error Recovery**: Escalate the request to the department head or system administrator.
*   **Completion**: The approval record is marked as "approved" or "rejected" and locked.
