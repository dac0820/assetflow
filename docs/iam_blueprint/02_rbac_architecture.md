# RBAC Architecture & Permission Matrix: AssetFlow ERP

This document details the **Role-Based Access Control (RBAC)** architecture, permission rules, and dynamic roles capabilities for **AssetFlow ERP**.

---

## 1. System Roles Definitions

AssetFlow ERP implements a strict RBAC policy with six predefined user roles:

1.  **`admin`**: System administrator. Has full access across all modules, including user management, database updates, and security logs.
2.  **`manager`**: Operations manager. Responsible for asset registration, transfer creations, allocations, and maintenance scheduling.
3.  **`dept_head`**: Department Head. Approves internal transfer requests and asset allocations for their department.
4.  **`employee`**: Regular end user. Can request allocations and book shared resources.
5.  **`auditor`**: Compliance auditor. Creates and closes audit cycles. Has read-only access to asset ledgers and transactions history.
6.  **`technician`**: Maintenance technician. Performs repairs, logs costs, and closes maintenance tickets.

---

## 2. Dynamic Custom Roles Expansion

To support future requirements, the database schema decouples roles and permissions using a Many-to-Many relationship structure:

```
[roles] 1 ─── * [role_permissions] * ─── 1 [permissions]
```

*   **Custom Roles Creation**: Administrators can create custom roles by adding rows to the `roles` table and linking them to specific permission records in the `role_permissions` join table.
*   **Decoupled Middleware**: Access checks are based on permission codes (e.g., `asset:create`) rather than hardcoded role names (e.g., `admin`). This allows new roles to be created with custom permission sets without changing backend code.

---

## 3. Permission Matrix

| Permission Code | Description | Admin | Manager | Dept Head | Employee | Auditor | Tech |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`user:create`** | Register new users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`user:role_assign`**| Modify user roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`asset:create`** | Register new assets | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`asset:edit`** | Edit asset properties | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`asset:delete`** | Retire or delete assets | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`asset:read`** | View asset listings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`transfer:request`**| Request asset transfer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **`transfer:approve`**| Approve asset transfer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **`booking:create`** | Book shared resources | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **`maint:request`** | Submit repair request | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **`maint:resolve`** | Complete repair log | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`audit:create`** | Schedule audit cycles | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **`audit:execute`** | Verify asset scans | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **`finance:calculate`**| Run depreciation tasks | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`finance:read`** | Read valuation reports | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **`report:export`** | Export data to CSV/PDF | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## 4. Role Isolation Boundaries

To prevent unauthorized horizontal data access (IDOR):
1.  **Department Scope**: Users with the `dept_head` or `employee` roles can only view allocations and transfer requests belonging to their own department ID.
2.  **Technician Scope**: Users with the `technician` role can only update maintenance requests assigned to them.
3.  **Auditor Scope**: Users with the `auditor` role have read-only access to transaction history and cannot modify asset valuations.
