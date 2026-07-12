# Constraints & Database Security: AssetFlow ERP

This document specifies the database integrity constraints, cascading rules, data encryption standards, and audit trail protection triggers for **AssetFlow ERP**.

---

## 1. Database Integrity Constraints

### 1.1 Foreign Keys & Cascading Rules
To protect audit logs and prevent orphan records, AssetFlow implements a strict referential integrity strategy:

*   **`ON DELETE RESTRICT`**: Applied to parent tables.
    *   Example: A `user` record cannot be deleted if it has related `activity_logs`.
    *   Example: An `asset` record cannot be deleted if it has related `asset_allocations` or `maintenance_history` logs.
*   **`ON DELETE CASCADE`**: Applied strictly to temporary or dependent, non-financial tables.
    *   Example: Deleting an `asset` will cascade delete its `asset_images` and `asset_documents`.
    *   Example: Deleting an `audit_cycle` will cascade delete its `audit_results`.

### 1.2 Database-Level Check Constraints
To prevent bad data ingestion, the database enforces the following check constraints:
*   `chk_assets_cost`: `purchase_cost > 0.00`
*   `chk_assets_salvage`: `salvage_value <= purchase_cost`
*   `chk_users_attempts`: `failed_login_attempts >= 0`

---

## 2. Data Encryption & Security

### 2.1 Encryption in Transit
*   **TLS 1.3**: All connections between the FastAPI server and the PostgreSQL database must use TLS 1.3.
*   **Enforcement**: The database connection string requires SSL mode:
    ```ini
    sslmode=verify-full
    ```

### 2.2 Encryption at Rest
*   **AES-256**: Managed by Render's underlying storage layer, encrypting database files, temp files, and backups at rest.

### 2.3 Secrets Management
*   Database credentials are never stored in source control. They are injected at runtime via Render's environment variables (`DATABASE_URL`).

---

## 3. Audit Trail Protection (Database Triggers)

To guarantee that audit trails are tamper-proof and satisfy regulatory compliance rules, write operations on the `activity_logs` table are restricted.

### PostgreSQL Rules for Immutability
We implement database rules to block all `UPDATE` and `DELETE` queries on the `activity_logs` table:

```sql
-- Block all update statements
CREATE RULE lock_activity_updates 
AS ON UPDATE TO activity_logs 
DO INSTEAD NOTHING;

-- Block all delete statements
CREATE RULE lock_activity_deletes 
AS ON DELETE TO activity_logs 
DO INSTEAD NOTHING;
```
By implementing these database-level rules, the database ignores attempts to update or delete audit logs, even if an attacker gains administrative database access.
