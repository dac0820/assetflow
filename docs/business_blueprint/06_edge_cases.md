# Edge Case Analysis: AssetFlow ERP

This document contains **100 distinct edge cases** across nine operational domains, detailing potential issues and how the system prevents or handles them.

---

## 1. Asset Registry & QR Codes (Cases 1-12)

1.  **Duplicate Serial Number Input**: A user registers a new device with a serial number that is already active.
    *   *System Action*: The database unique index rejects the write, and the API returns a validation error.
2.  **Duplicate QR Code Value**: The QR code scanner reads a code that is already assigned to a different asset.
    *   *System Action*: The registration endpoint blocks the transaction, and the UI prompts the user to print a new label.
3.  **Invalid Characters in Serial Number**: Serial numbers contain non-ASCII characters or spaces.
    *   *System Action*: Input validation trims whitespace and sanitizes the input before validation.
4.  **Zero Useful Life**: An asset is registered with a useful life of 0 years.
    *   *System Action*: Validation rules enforce `useful_life_years >= 1` for categories using straight-line depreciation.
5.  **Negative Cost**: An asset is registered with a negative purchase cost.
    *   *System Action*: Validation rules block the request: `assert purchase_cost > 0`.
6.  **Salvage Value Exceeds Cost**: An asset is registered with a salvage value higher than its purchase cost.
    *   *System Action*: The system blocks registration: `assert salvage_value < purchase_cost`.
7.  **Future Acquisition Date**: An asset is registered with an acquisition date in the future.
    *   *System Action*: Validation checks enforce `purchase_date <= current_date`.
8.  **Empty Name String**: The asset name field consists of spaces.
    *   *System Action*: The validator trims the string and rejects it if empty.
9.  **Extremely Large Cost Input**: The user inputs an asset purchase cost of $999,999,999,999,999.
    *   *System Action*: Pydantic schemas enforce a maximum decimal limit of `999,999,999.99` to prevent database overflow.
10. **Special Characters in Asset Name**: An asset name contains special characters like `Laptop <script>alert('xss')</script>`.
    *   *System Action*: The React frontend renders inputs as plain text, preventing HTML injection.
11. **Retiring a Retired Asset**: A user attempts to retire an asset that is already retired.
    *   *System Action*: The service layer blocks the request, returning a "State transition not allowed" error.
12. **Missing Asset Category**: The user selects a category ID that was deleted by another user.
    *   *System Action*: Foreign key constraints reject the write, returning an error.

---

## 2. Allocations & Bookings (Cases 13-25)

13. **Double Booking Overlap**: Two users attempt to book the same vehicle for overlapping time slots.
    *   *System Action*: A PostgreSQL exclusion constraint blocks the second write transaction.
14. **Allocation to Terminated Employee**: A manager attempts to assign a laptop to an employee who has left the company.
    *   *System Action*: The allocation engine verifies the employee's status is "active".
15. **Allocation of Retired Asset**: A user attempts to assign a retired asset to an employee.
    *   *System Action*: The system blocks the assignment since the asset status is not "available".
16. **Self-Allocation Attempt**: An asset manager attempts to assign a device to themselves.
    *   *System Action*: The system allows self-allocation, but logs the action in the audit trail.
17. **Negative Booking Duration**: A user sets a booking's end time before its start time.
    *   *System Action*: Validation rules enforce `end_time > start_time`.
18. **Booking in the Past**: A user attempts to book a conference room for yesterday.
    *   *System Action*: The validator checks that `start_time >= current_time`.
19. **Exceeding Maximum Active Bookings**: An employee attempts to schedule their 4th active booking.
    *   *System Action*: The booking service blocks the request, enforcing the maximum limit of 3 active bookings.
20. **Booking a Damaged Asset**: A user attempts to book an asset marked as "damaged".
    *   *System Action*: The booking engine blocks the request because the asset's condition is not "good" or "excellent".
21. **Simultaneous Booking Requests**: Two users click "Confirm Booking" for the same asset at the exact same millisecond.
    *   *System Action*: Database transaction isolation level is set to `SERIALIZABLE`, causing one transaction to succeed and the other to fail and roll back.
22. **Returning a Return**: An employee submits a return request for an asset that has already been returned.
    *   *System Action*: The return service checks the allocation record and blocks duplicate returns.
23. **Asset Allocation with Null Employee ID**: A manager attempts to save an allocation record without specifying an employee ID.
    *   *System Action*: Pydantic schemas enforce that `employee_id` is a required field.
24. **Exceeding Allocation Count**: Assigning more than 5 high-value assets to a single employee.
    *   *System Action*: The system flags this for administrator review before allowing the assignment.
25. **Expired Session Booking**: A user completes a booking form after their session has expired.
    *   *System Action*: The API returns a `401 Unauthorized` error, and the UI redirects the user to the login page.

---

## 3. Asset Transfers & Locations (Cases 26-38)

26. **Transfer to Same Location**: A user requests to transfer an asset to its current location.
    *   *System Action*: The validator checks that `target_location_id != source_location_id`.
27. **Transfer of Missing Asset**: A user requests to transfer an asset marked as "lost".
    *   *System Action*: The transfer service blocks the request until the asset's status is resolved.
28. **Transfer Approval by Requestor**: The person requesting a transfer attempts to approve it.
    *   *System Action*: The system blocks the action: `assert requester_id != approver_id`.
29. **Target Location Deleted**: The target location for a transfer is deleted before the transfer is approved.
    *   *System Action*: Foreign key constraints prevent the deletion if active transfers reference the location.
30. **Concurrent Location Updates**: Two managers attempt to update an asset's location simultaneously.
    *   *System Action*: Optimistic locking flags the conflict, forcing one manager to reload the record.
31. **Transfer to Inactive Department**: A manager attempts to transfer an asset to an inactive department.
    *   *System Action*: The transfer validator verifies the target department is active.
32. **Cross-Border Transfer Tax Fields**: An asset is transferred internationally without required import documents.
    *   *System Action*: The system blocks the transfer until the user uploads the import paperwork.
33. **Approved Transfer of Deleted Asset**: An administrator deletes an asset while a transfer request is pending.
    *   *System Action*: Foreign key constraints block the asset deletion while it has pending transfers.
34. **Re-approving an Approved Transfer**: A user attempts to approve a transfer that was already approved.
    *   *System Action*: The service layer checks the transfer status and blocks duplicate approvals.
35. **Transfer Request for Retired Asset**: A user requests a transfer for a retired asset.
    *   *System Action*: The system blocks the transfer request since retired assets cannot be moved.
36. **Location Name Duplication**: A user attempts to create a new location with a name that already exists.
    *   *System Action*: Unique constraints on the location name reject the request.
37. **Deleting a Location with Assets**: A user attempts to delete a warehouse location that still contains active assets.
    *   *System Action*: The system blocks the deletion until all assets are moved to another location.
38. **Transfer with Missing Approver**: A transfer request is submitted without an assigned approver.
    *   *System Action*: The system automatically assigns the department head as the default approver.

---

## 4. Audits & Compliance (Cases 39-51)

39. **Auditing a Retired Asset**: An auditor attempts to add a retired asset to an active audit checklist.
    *   *System Action*: The audit service excludes retired assets from active checklists.
40. **Auditing by Non-Auditor**: A regular employee attempts to submit audit results.
    *   *System Action*: Role-based permissions restrict the endpoint to the Admin and Auditor roles.
41. **Audit Scheduled in the Past**: A user schedules an audit cycle with a start date in the past.
    *   *System Action*: Validation rules enforce `scheduled_date >= current_date`.
42. **Closing an Empty Audit**: A user attempts to close an audit cycle without verifying any assets.
    *   *System Action*: The audit service requires at least one verified asset record before closing.
43. **Flagging a Non-existent Discrepancy**: An auditor flags an asset condition as "excellent" but adds notes indicating it is damaged.
    *   *System Action*: The UI prompts the auditor to match the condition rating with their notes.
44. **Concurrent Audit Submissions**: Two auditors attempt to submit results for the same asset simultaneously.
    *   *System Action*: Database locking prevents duplicate audit entries.
45. **Deleting an Active Audit Cycle**: An administrator attempts to delete an audit cycle that is currently in progress.
    *   *System Action*: The system blocks the deletion and requires the user to cancel or complete the audit first.
46. **Auditing an Asset Allocated to another Department**: An auditor verifies an asset assigned to a different department.
    *   *System Action*: The system logs the department discrepancy and alerts the asset manager.
47. **Auditor Promoted During Audit**: An auditor's role is changed to Viewer while they have an active audit open.
    *   *System Action*: Their active session is updated, revoking their permission to submit the audit.
48. **Audit Verification with Blank Notes**: An auditor flags a discrepancy but leaves the notes field empty.
    *   *System Action*: The system makes the notes field mandatory when a discrepancy is flagged.
49. **Double Closing an Audit**: A user attempts to submit a close request for an already closed audit.
    *   *System Action*: The service layer blocks the request and returns an "Audit already closed" error.
50. **Auditing a Deleted Asset**: An auditor attempts to verify an asset that was deleted during the audit cycle.
    *   *System Action*: The system flags the asset as missing and updates the audit log.
51. **Audit Cycle Overlap**: Scheduling two audit cycles for the same department during overlapping dates.
    *   *System Action*: The system displays a warning but allows the schedules if authorized.

---

## 5. Maintenance & Repair (Cases 52-64)

52. **Maintenance Start Date After End Date**: A technician inputs a completion date that is before the start date.
    *   *System Action*: Validation checks enforce `end_date >= start_date`.
53. **Scheduling Maintenance for Retired Asset**: A manager schedules service for a retired asset.
    *   *System Action*: The maintenance service blocks the request.
54. **Maintenance Cost Exceeds Asset Value**: The logged repair cost is higher than the asset's purchase cost.
    *   *System Action*: The system processes the transaction but flags it for manager review.
55. **Completing Maintenance Without Notes**: A technician marks a repair as complete but leaves the notes field empty.
    *   *System Action*: The system requires notes to be added before saving.
56. **Simultaneous Maintenance Tasks**: Scheduling two active maintenance runs for the same asset.
    *   *System Action*: The system blocks duplicate active maintenance records.
57. **Assigning Inactive Technician**: A scheduler assigns maintenance to a technician who is inactive or suspended.
    *   *System Action*: The technician selector filters out inactive users.
58. **Deleting Maintenance Record with Active Costs**: A user attempts to delete a completed maintenance record.
    *   *System Action*: Completed maintenance logs cannot be deleted to preserve financial audit history.
59. **Negative Maintenance Cost**: Inputting a negative value in the maintenance cost field.
    *   *System Action*: The validator enforces `cost >= 0`.
60. **Technician updates role to Viewer**: A technician is downgraded to viewer while they have active repairs assigned.
    *   *System Action*: The system reassigns the tasks to the maintenance pool and alerts the manager.
61. **Maintenance on Asset in Use**: Scheduling urgent maintenance for an asset that is currently allocated.
    *   *System Action*: The system notifies the employee and manager to schedule a return before repairs begin.
62. **Completed Maintenance without Technician Sign-off**: A user attempts to close a ticket without a technician ID.
    *   *System Action*: The system requires a technician ID to close the ticket.
63. **Updating Maintenance Notes after Closure**: A user attempts to edit repair notes on a closed maintenance record.
    *   *System Action*: Completed maintenance records are locked to prevent editing.
64. **Double Booking a Technician**: Assigning two urgent repairs to the same technician at the same time.
    *   *System Action*: The system displays a warning but allows the assignment if needed.

---

## 6. User Management & Authentication (Cases 65-77)

65. **Deleting the Last Admin**: An admin attempts to delete their own account when they are the only admin left.
    *   *System Action*: The system blocks the deletion.
66. **Admin Demoting Themselves**: An admin attempts to change their own role to Viewer.
    *   *System Action*: The system blocks the role change to ensure at least one admin remains active.
67. **Duplicate Email Registration**: Registering a new user with an email address that is already in use.
    *   *System Action*: The system rejects the registration.
68. **Invalid Email Domain**: Registering a user with a non-corporate email address.
    *   *System Action*: The registration service restricts email signups to the corporate domain.
69. **Promoting to Admin without Second Sign-off**: Demanding admin access changes.
    *   *System Action*: The system flags the change as pending until approved by a second administrator.
70. **Self-Approval of Role Promotion**: An administrator attempts to approve their own role promotion.
    *   *System Action*: The system blocks self-approvals.
71. **Accessing API with Expired JWT**: A client sends a request using an expired access token.
    *   *System Action*: The API returns a `401 Unauthorized` error.
72. **Logging In with Suspended Account**: A suspended employee attempts to log in.
    *   *System Action*: The login service blocks access and returns a "User account suspended" message.
73. **Password Change without Verification**: Changing a password without entering the old password.
    *   *System Action*: The password update endpoint requires the current password for verification.
74. **Weak Password Submission**: A user sets their password to `123456`.
    *   *System Action*: Validation rules enforce a minimum password strength check.
75. **Simultaneous Logins**: A user logs in from multiple devices at the same time.
    *   *System Action*: The system allows simultaneous logins but tracks active sessions in the database.
76. **Role Demotion with Active Approvals Pending**: Demoting a manager who has pending approvals assigned to them.
    *   *System Action*: The system requires reassigning the pending approvals before changing the role.
77. **Blank Full Name String**: Submitting a user profile update with spaces in the name field.
    *   *System Action*: The validator trims the string and rejects it if empty.

---

## 7. System, Network & Database (Cases 78-90)

78. **Database Connection Dropout**: The database connection drops during an asset transfer transaction.
    *   *System Action*: The API returns a `500 Internal Server Error`, and all pending database writes are rolled back.
79. **Client Clock Discrepancy**: A client machine's system clock is set 1 hour in the past, causing it to send invalid timestamps.
    *   *System Action*: The server ignores client-generated timestamps for transactions and uses its own UTC clock.
80. **Invalid JSON Payload**: A client sends malformed JSON to an API endpoint.
    *   *System Action*: FastAPI returns a `422 Unprocessable Entity` error.
81. **SQL Injection Attempt**: A user inputs SQL commands into a search field.
    *   *System Action*: SQLAlchemy parameterizes all queries, preventing SQL injection.
82. **Cross-Site Scripting (XSS) in Uploads**: A user uploads an HTML file containing malicious scripts.
    *   *System Action*: Uploaded files are served with headers that prevent execution in the browser.
83. **API Rate Limit Exceeded**: A script attempts to spam an API endpoint with requests.
    *   *System Action*: Rate limiting middleware blocks the requests and returns a `429 Too Many Requests` error.
84. **Database Disk Full**: The database runs out of storage space.
    *   *System Action*: Managed database alerts notify operations to scale storage, and transactions are rolled back.
85. **Concurrent Schema Migrations**: Running database migrations from multiple instances at the same time.
    *   *System Action*: Alembic uses migration lock tables to run migrations sequentially.
86. **CORS Configuration Error**: A client attempts to access the API from an unauthorized origin.
    *   *System Action*: CORS middleware blocks the request.
87. **Redis Cache Offline**: The Redis cache server goes offline.
    *   *System Action*: The application falls back to querying the primary database directly, and logs the service outage.
88. **UUID Collision**: Generating a UUID that already exists in the database.
    *   *System Action*: The system uses UUIDv4, which has a negligible collision probability, and the database unique constraints protect integrity.
89. **Broken Access Control via ID Modification**: A user attempts to edit another user's profile by changing the ID parameter in the URL.
    *   *System Action*: The backend verifies that the requester has the required permissions to modify the target ID.
90. **Expired Database Connection Pool**: Database connections in the pool go stale.
    *   *System Action*: The pool checker tests and recycles stale connections before returning them to the application.

---

## 8. Finance & Depreciation (Cases 91-100)

91. **Depreciation Salvage Value Exceeded**: Calculating monthly depreciation when the asset's current value has dropped below its salvage value.
    *   *System Action*: The depreciation engine caps the calculation to ensure the asset value does not drop below salvage value.
92. **Depreciation on Retired Asset**: The background task attempts to calculate depreciation for a retired asset.
    *   *System Action*: The task filters out retired and lost assets.
93. **Manual Override of Depreciation Ledger**: A user attempts to manually edit calculated depreciation figures.
    *   *System Action*: The depreciation ledger is read-only, and changes can only be made through system-run recalculations.
94. **Fiscal Year Overlap**: Calculating depreciation for overlapping fiscal years.
    *   *System Action*: The service layer validates target dates to prevent duplicate calculations for the same period.
95. **Useful Life Set to Zero During Calculation**: A user updates an asset's useful life to 0 during a depreciation calculation run.
    *   *System Action*: Optimistic locking blocks the update, and the calculation run uses the original value.
96. **Asset Cost Changed After Calculation**: A user updates an asset's purchase cost after depreciation has already been calculated.
    *   *System Action*: The system triggers an automatic recalculation of the depreciation schedule.
97. **Calculating Depreciation for Non-Depreciable Category**: Attempting to calculate depreciation for a category that does not support it (e.g., land).
    *   *System Action*: The service layer skips the calculation for non-depreciable categories.
98. **Double Declining Balance with Zero Cost**: Calculating double declining depreciation for an asset with a purchase cost of $0.
    *   *System Action*: The system blocks the calculation and flags the asset record for review.
99. **Fiscal Year Calculation in the Future**: A user schedules a depreciation run for a future fiscal year.
    *   *System Action*: The system restricts calculations to the current or past fiscal years.
100. **Recalculating Locked Ledger Period**: A user attempts to recalculate depreciation for a closed and locked financial period.
     *   *System Action*: The system blocks updates to locked periods to preserve financial reporting integrity.
