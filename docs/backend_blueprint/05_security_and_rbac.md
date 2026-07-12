# Security & RBAC Specification: AssetFlow ERP

This document contains the security specifications, authentication flows, account lock policies, and the Role-Based Access Control (RBAC) permission matrix for **AssetFlow ERP**.

---

## 1. Authentication & Session Strategy

### 1.1 JWT Token Lifecycle
*   **Access Token**: Short-lived JWT (15-minute expiration). Sent in the `Authorization: Bearer <Token>` header.
*   **Refresh Token**: Long-lived secure cookie (7-day expiration). Configured with the following settings:
    *   `HttpOnly`: JavaScript cannot access the token, preventing XSS-based theft.
    *   `Secure`: Sent only over HTTPS connections.
    *   `SameSite=Strict`: Prevents the browser from sending the cookie with cross-site requests, mitigating CSRF.
*   **Revocation**: When a user logs out, their active refresh token is deleted from the PostgreSQL database, invalidating the session.

### 1.2 Account Lockout Policy
*   **Trigger**: A user inputs an incorrect password **5 consecutive times**.
*   **Action**: The user account is locked (`is_active` set to false, or `locked_until` timestamp populated).
*   **Lock Duration**: **15 Minutes**. Attempts to log in during this window return an `HTTP 423 Locked` error without querying password validation.
*   **Recovery**: The account is automatically unlocked after the lock window expires, or manually unlocked by an administrator.

### 1.3 Password Policy & Cryptography
*   **Hashing Algorithm**: **bcrypt** (cost factor: 12).
*   **Complexity Rules**:
    *   Minimum length: 12 characters.
    *   Must contain at least: one uppercase letter, one lowercase letter, one number, and one special character.

---

## 2. RBAC & Permission Matrix

Permissions are granular codes mapped to roles via the `role_permissions` table.

### 2.1 Role Definitions
1.  **`admin`**: System administrator. Has full access to all endpoints, configuration overrides, and audit logs.
2.  **`manager`**: Operations manager. Manages assets, locations, transfers, and maintenance logs.
3.  **`accountant`**: Finance officer. Manages costs, categories, and depreciation schedules.
4.  **`viewer`**: Read-only user. Can view records but cannot perform write operations.

### 2.2 Permissions Mapping Matrix

| Permission Code | Description | Admin | Manager | Accountant | Viewer |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`user:create`** | Create user accounts | ✅ | ❌ | ❌ | ❌ |
| **`user:edit`** | Edit user roles and profiles | ✅ | ❌ | ❌ | ❌ |
| **`asset:create`** | Register new assets | ✅ | ✅ | ❌ | ❌ |
| **`asset:edit`** | Edit asset details | ✅ | ✅ | ❌ | ❌ |
| **`asset:delete`** | Retire or delete assets | ✅ | ❌ | ❌ | ❌ |
| **`transfer:approve`**| Approve asset transfers | ✅ | ✅ | ❌ | ❌ |
| **`finance:calculate`**| Run depreciation calculations | ✅ | ❌ | ✅ | ❌ |
| **`finance:read`** | View valuations and logs | ✅ | ✅ | ✅ | ✅ |
| **`audit:execute`** | Perform physical audits | ✅ | ✅ | ❌ | ❌ |

---

## 3. Threat Mitigation Strategy

### 3.1 SQL Injection (SQLi)
*   **Mitigation**: The backend database interface is built using SQLAlchemy ORM. All queries are parameterized, separating user inputs from SQL query structures.

### 3.2 Cross-Site Scripting (XSS)
*   **Mitigation**: The React frontend sanitizes and escapes all user-supplied strings before rendering them to the DOM. Access tokens are stored in application memory rather than `localStorage`.

### 3.3 Cross-Site Request Forgery (CSRF)
*   **Mitigation**: API requests require the JWT access token in the HTTP header. The refresh token cookie is configured with `SameSite=Strict`, blocking cross-domain CSRF attempts.

### 3.4 Insecure Direct Object References (IDOR)
*   **Mitigation**: The backend validates that the requesting user has the authorization required to access the target asset or department ID, rather than relying solely on the presence of a valid JWT token.

### 3.5 Audit Log Tampering
*   **Mitigation**: Write operations on the `activity_logs` table are restricted. Database rules block all `UPDATE` and `DELETE` queries on the logs table:
    ```sql
    CREATE RULE lock_activity_updates AS ON UPDATE TO activity_logs DO INSTEAD NOTHING;
    CREATE RULE lock_activity_deletes AS ON DELETE TO activity_logs DO INSTEAD NOTHING;
    ```
