# Security & Testing Blueprint: Asset Management Engine

This document outlines the security threat mitigations, test suites, and contains a checklist of **200 system edge cases** for the **Asset Management Engine**.

---

## 1. Security Threat Mitigations

---

### 1.1 QR Code Tampering
*   **Threat**: Attackers modify QR code payloads (e.g., changing the ID in `https://assetflow.com/assets/{uuid}`) to gain unauthorized access to other assets.
*   **Mitigation**: The backend validates that the requesting user's department ID matches the target asset's department before returning data.

---

### 1.2 CSV Injection (Formula Injection)
*   **Threat**: Attackers upload a CSV file containing formulas (e.g., `=cmd|' /C calc'!A1`) in asset description fields, attempting to execute malicious commands when a manager exports and opens the file in Excel.
*   **Mitigation**: The CSV import service sanitizes all text inputs, stripping symbols like `=`, `+`, `-`, and `@` from the beginning of cells.

---

### 1.3 Document Injection
*   **Threat**: Attackers upload HTML files containing script tags disguised as PDF attachments.
*   **Mitigation**: The upload service verifies file MIME types and extensions against an allowlist, renames files to UUIDs, and stores them in isolated buckets with execute permissions disabled.

---

## 2. Testing Checklist (200 Edge Cases)

We compile exactly 200 edge cases grouped into domains, detailing potential issues and how the system prevents or handles them.

### 2.1 Asset Registration & Metadata (Cases 1-30)
1.  **Duplicate Serial Number**: Rejects duplicate manufacturer serial numbers.
2.  **Blank Asset Name**: Trims whitespaces and rejects if empty.
3.  **Negative Purchase Cost**: Checks `purchase_cost > 0`.
4.  **Zero Useful Life**: Enforces `useful_life_years >= 1`.
5.  **Future Purchase Date**: Rejects dates in the future.
6.  **Salvage Value Exceeds Cost**: Enforces `salvage_value <= purchase_cost`.
7.  **Extremely Large Cost Input**: Restricts inputs to `999,999,999.99`.
8.  **XSS in Description**: Escapes HTML tags in descriptions.
9.  **Special Characters in Name**: Sanitizes name strings before saving.
10. **Null Category ID**: Enforces category selection.
11. **Null Location ID**: Enforces location selection.
12. **Acquisition Date Before Category Creation**: Allows registration but flags it for review.
13. **Category Deleted During Registration**: Rejects request if the category ID no longer exists.
14. **Location Deleted During Registration**: Rejects request if the location ID no longer exists.
15. **Malformed Category UUID**: Validates UUID formats.
16. **Malformed Location UUID**: Validates UUID formats.
17. **Empty String Category ID**: Rejects empty strings.
18. **Asset Name Exceeds 255 Characters**: Truncates name or rejects input.
19. **Serial Number Exceeds 100 Characters**: Rejects input.
20. **Zero Purchase Cost**: Rejects `purchase_cost = 0`.
21. **Negative Salvage Value**: Rejects `salvage_value < 0`.
22. **Decimal Overflow in Useful Life**: Enforces integers for useful life.
23. **Adding Assets to Inactive Location**: Rejects registrations at inactive locations.
24. **Duplicate Asset Tags**: Rejects duplicate asset tag inputs.
25. **Null Serial Number**: Enforces serial number field.
26. **Whitespace Only in Serial Number**: Trims and checks.
27. **Lease Document Upload Fail**: Continues registration but flags document upload as failed.
28. **Invalid JSON Metadata Format**: Rejects invalid JSON schemas.
29. **Null Purchase Date**: Enforces purchase date field.
30. **Asset Name Starting with Special Characters**: Trims and validates.

### 2.2 Asset Lifecycle & Status Transitions (Cases 31-60)
31. **Allocating Lost Asset**: Blocks allocation attempts for lost assets.
32. **Allocating Retired Asset**: Blocks allocation attempts for retired assets.
33. **Allocating Disposed Asset**: Blocks allocation attempts for disposed assets.
34. **Allocating Asset in Maintenance**: Blocks allocation attempts for assets under repair.
35. **Transferring Asset in Maintenance**: Blocks transfer attempts for assets under repair.
36. **Retiring Allocated Asset**: Blocks retirement attempts for active allocations.
37. **Deleting Allocated Asset**: Blocks delete attempts for active allocations.
38. **Transitioning Retired to Available**: Blocks transition.
39. **Transitioning Disposed to Available**: Blocks transition.
40. **Transitioning Lost to Allocated**: Blocks transition.
41. **Simultaneous Allocation Requests**: Optimistic locking blocks duplicate allocations.
42. **Double Return Request**: Ignores duplicate return submissions.
43. **Self-Allocation by Manager**: Logs action but allows it.
44. **Allocating to Terminated Employee**: Blocks assignment.
45. **Allocating to Suspended Employee**: Blocks assignment.
46. **Transferring Lost Asset**: Blocks transfer requests.
47. **Transferring Retired Asset**: Blocks transfer requests.
48. **Transferring Disposed Asset**: Blocks transfer requests.
49. **Concurrent Location Updates**: Optimistic locking resolves updates.
50. **Re-approving an Approved Transfer**: Rejects duplicate approvals.
51. **Approving a Rejected Transfer**: Rejects request.
52. **Rejecting an Approved Transfer**: Rejects request.
53. **Transfer Approval by Requester**: Blocks self-approval.
54. **Transfer Request with Same Source & Target**: Rejects request.
55. **Transfer Request for Inactive Department**: Rejects request.
56. **Asset Deleted During Pending Transfer**: Blocks deletion.
57. **Location Deleted During Pending Transfer**: Blocks deletion.
58. **Asset Marked Lost During Transfer**: Cancels transfer.
59. **Asset Damaged During Transfer**: Recomputes transfer destination to maintenance.
60. **Disposal of Non-Retired Asset**: Rejects disposal.

### 2.3 Operations, Bookings & Maintenance (Cases 61-90)
61. **Overlapping Booking Slots**: Database constraint blocks overlapping bookings.
62. **Booking Retired Asset**: Blocks booking requests.
63. **Booking Damaged Asset**: Blocks booking requests.
64. **Booking Lost Asset**: Blocks booking requests.
65. **Booking Inactive Resource**: Blocks booking requests.
66. **Booking in the Past**: Rejects dates in the past.
67. **Negative Booking Duration**: Rejects invalid durations.
68. **Exceeding Active Booking Limit**: Enforces maximum active bookings.
69. **Maintenance Start Date After End Date**: Rejects invalid dates.
70. **Maintenance on Retired Asset**: Blocks maintenance requests.
71. **Completed Maintenance without Notes**: Enforces mandatory notes.
72. **Completed Maintenance with Negative Cost**: Rejects negative costs.
73. **Technician Promoted to Manager**: Updates task assignments.
74. **Technician Terminated During Active Repair**: Reassigns active repairs.
75. **Asset Damaged During Booking**: Cancels remaining bookings.
76. **Asset Lost During Maintenance**: Updates status to lost.
77. **Maintenance Cost Exceeds Purchase Cost**: Saves transaction but flags it.
78. **Duplicate Maintenance Tasks**: Blocks duplicate requests.
79. **Assigning Inactive Technician**: Filters out inactive technicians.
80. **Closing Closed Maintenance Ticket**: Rejects duplicate closures.
81. **Updating Closed Maintenance Notes**: Locks closed tickets.
82. **Booking Resource Over Capacity**: Rejects booking.
83. **Booking Cancelled After Start Time**: Processes cancellation.
84. **Booking Ended Late**: Logs late return.
85. **Concurrent Bookings on Same Time Slot**: Isolation level blocks.
86. **Maintenance Scheduled During Booking**: Warns user and cancels booking.
87. **Asset Category Changed During Booking**: Updates booking info.
88. **Asset Category Deleted During Maintenance**: Blocks category deletion.
89. **Location Deleted During Booking**: Blocks location deletion.
90. **Technician Specialty Mismatch**: Allows assignment but flags it.

### 2.4 Audits & Discrepancies (Cases 91-120)
91. **Auditing Retired Asset**: Excludes retired assets from checklists.
92. **Auditing by Non-Auditor**: Blocks access.
93. **Audit Scheduled in the Past**: Rejects invalid scheduled dates.
94. **Closing Empty Audit**: Rejects closure.
95. **Auditing Deleted Asset**: Flags asset as missing.
96. **Asset Deleted During Audit**: Updates checklist.
97. **Asset Allocated During Audit**: Updates checklist.
98. **Audit Verification with Blank Notes**: Enforces notes.
99. **Auditor Promoted During Audit**: Session updates credentials.
100. **Auditing Asset of other Department**: Logs department discrepancy.
101. **Double Verification of same Asset**: Updates verification details.
102. **Audit Cycle Overlap**: Warns user but allows.
103. **Audit Discrepancy Severity Change**: Updates severity.
104. **Resolving Resolved Discrepancy**: Blocks request.
105. **Audit Result with Future Scanned Timestamp**: Server overrides timestamp.
106. **Auditor Terminated During Cycle**: Reassigns audit.
107. **Audit Table Pagination Lag**: Virtualizes scrolling.
108. **Audit Scan with Bad QR Payload**: Returns scanner error.
109. **Auditing Asset in Maintenance**: Allows verification.
110. **Re-opening Closed Audit Cycle**: Locks completed cycles.
111. **Auditing Asset in Lost Status**: Updates status to verified.
112. **Audit Checklist Row Edit without Permissions**: Blocks edits.
113. **Flagging Resolved Asset as Discrepancy**: Updates record.
114. **Audit Cycle Deleted with Open Discrepancies**: Blocks deletion.
115. **Offline Scan Conflict on Reconnection**: Optimistic locking resolves.
116. **Audit Report Export Fail**: Logs export error.
117. **Auditing Asset without QR Label**: Enforces manual input.
118. **Bulk Verification of Checklist**: Processes updates.
119. **Discrepancy Report without Audit Link**: Blocks creation.
120. **Audit Status Transition Invalid**: Rejects transition.

### 2.5 Security, Authentication & Session (Cases 121-150)
121. **Deleting last Admin**: Blocks deletion.
122. **Admin demoting themselves**: Blocks demotion.
123. **Duplicate Email Signup**: Rejects registration.
124. **Invalid Email Domain**: Restricts email domains.
125. **Role Promotion without approval**: Sets change as pending.
126. **Self-Approval of Promotion**: Blocks self-approval.
127. **Accessing API with Expired JWT**: Returns 401.
128. **Logging in with Suspended Account**: Blocks access.
129. **Password change without verification**: Enforces old password validation.
130. **Weak Password Submission**: Enforces complexity rules.
131. **Simultaneous Logins**: Tracks active sessions.
132. **Role Demotion with Active Approvals Pending**: Enforces task reassignment.
133. **SQL Injection in Search**: Parameterized queries block injection.
134. **XSS Script in Uploads**: Sanitizes file uploads.
135. **API Rate Limit Exceeded**: Returns 429.
136. **Database Connection Dropout**: Rolls back transactions.
137. **Client Clock Discrepancy**: Server overrides timestamp.
138. **Invalid JSON Payload**: Returns 422.
139. **CORS Configuration Error**: Blocks request.
140. **Redis Cache Offline**: Falls back to database.
141. **UUID Collision**: Unique constraints protect integrity.
142. **IDOR via ID Modification**: Backend validates permissions.
143. **Expired DB Pool Connection**: Recycles connections.
144. **JWT Signature Modification**: Rejects token.
145. **CSRF with Session Cookie**: SameSite cookie blocks.
146. **Audit Log Tampering**: Database triggers block updates.
147. **Malicious File Upload**: Verifies MIME types.
148. **Filename Directory Traversal**: Renames files to UUIDs.
149. **Rate Limit Override attempt**: Throttles request.
150. **Session Hijack attempt**: Token rotation blocks.

### 2.6 System, Network & Database (Cases 151-180)
151. **Database Disk Full**: Rolls back transactions.
152. **Concurrent Schema Migrations**: Migration lock tables run sequentially.
153. **Network Connection Loss**: Reconnection retries.
154. **Server CPU Spike**: Auto-scaling spawns containers.
155. **API Timeout**: Gateway returns 504.
156. **Redis Eviction Policy Trigger**: Evicts oldest keys.
157. **Invalid Environment Variable**: App initialization fails.
158. **SMTP Server Offline**: Queues email tasks.
159. **Upload Directory Permissions Error**: Returns server error.
160. **Database Table Corrupted**: Restores backup.
161. **S3 Storage Offline**: Retries file upload.
162. **Celery Worker Crash**: Redis preserves task queue.
163. **Client Side React Crash**: Boundary catches error.
164. **Duplicate API Router mount**: Startup validates endpoints.
165. **Docker Container Crash**: Orchestrator restarts container.
166. **SSL Handshake Failure**: Blocks connection.
167. **Invalid CORS Origin Input**: App sanitizes list.
168. **Slow DB Query Block**: Timeout aborts query.
169. **Database Deadlock**: Transaction retries.
170. **DNS Resolution Failure**: App uses cached IPs.
171. **IP Address Change**: Session remains valid.
172. **User Agent Modification**: Session remains valid.
173. **Client Cookie Deletion**: Redirects to login.
174. **Duplicate API Query Parameter**: FastAPI parses first parameter.
175. **Large Payload Upload Attempt**: Gateway rejects payload.
176. **Database Index Corrupted**: Rebuilds index.
177. **Invalid DB Pool Size**: Adjusts pool limits.
178. **Server Time Drift**: NTP synchronizes clocks.
179. **Local Cache Invalidation Fail**: Evicts cache on timeout.
180. **Memory Leak in Background Task**: Worker restarts.

### 2.7 Finance, Depreciation & Reports (Cases 181-200)
181. **Depreciation Salvage Value Exceeded**: Caps depreciation.
182. **Depreciation on Retired Asset**: Skips retired assets.
183. **Manual Override of Depreciation**: Blocks edit requests.
184. **Fiscal Year Overlap**: Prevents duplicate calculations.
185. **Useful Life Changed During Calculation**: Blocks change.
186. **Asset Cost Changed After Calculation**: Triggers recalculation.
187. **Depreciation for Non-Depreciable Category**: Skips category.
188. **Double Declining with Zero Cost**: Blocks calculation.
189. **Calculation in the Future**: Restricts calculations.
190. **Recalculating Locked Ledger Period**: Blocks updates.
191. **Negative Useful Life**: Rejects useful life.
192. **Depreciation Run Timeout**: Processes in background.
193. **Failed Report PDF Generation**: Retries generation.
194. **CSV Export of 100K Rows**: Cursor pagination processes.
195. **PDF Export with Chinese Characters**: Unicode fonts render.
196. **Depreciation Method Modification**: Recalculates history.
197. **Changing Category useful life**: Updates assets default useful life.
198. **Report Request from Viewer**: Generates report.
199. **Export limit exceeded**: Restricts export sizes.
200. **Calculating Depreciation for Lost Asset**: Skips calculation.
