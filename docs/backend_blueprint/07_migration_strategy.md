# Database Migration Strategy: AssetFlow ERP

This document outlines the database schema migration workflow and deployment guidelines for **AssetFlow ERP** using **Alembic**.

---

## 1. Zero-Downtime Migration Principles

Applying database schema updates in production can lock tables and cause system downtime. To prevent this, the platform enforces the following guidelines:

### 1.1 Non-Destructive Schema Alterations
1.  **Adding Columns**: New columns must be added as `NULLABLE`. Once the migration is applied, run a background script to populate default data in batches before setting a `NOT NULL` constraint.
2.  **Renaming Columns**: Do not rename columns directly. Instead:
    *   Add a new column with the target name.
    *   Configure the application to write to both columns.
    *   Run a migration script to copy old data to the new column.
    *   Update the application to read from the new column.
    *   Drop the old column in a subsequent release.
3.  **Dropping Columns**: Mark columns as deprecated in the application layer first. Once you verify they are no longer in use, run a migration to drop them.

### 1.2 Lock Mitigation Strategies
*   Avoid adding columns with default values directly to tables containing over 100,000 rows. PostgreSQL will rewrite the table, locking it for the duration of the write.
*   Instead, create the column as nullable, then set the default constraint. This updates future rows without rewriting existing data.
*   Enforce a lock timeout on migration transactions to prevent them from blocking other queries:
    ```sql
    SET lock_timeout = '5s';
    ```

---

## 2. Alembic Migration Workflow

We manage database schema version control using Alembic:

```
[Define SQLAlchemy Model] ──> [Run Autogenerate Revision] ──> [Verify Script]
                                                                      │
                                                                      ▼
[Apply head to Staging] <── [Apply rollback to verify downgrade] <────┘
        │
(Success Validation)
        ▼
[Run upgrade head on Production]
```

### 2.1 Developer Workflow
1.  **Define changes**: Update the SQLAlchemy models in `app/models/`.
2.  **Generate migration script**:
    ```bash
    alembic revision --autogenerate -m "add_warranty_table"
    ```
3.  **Review the script**: Check the generated file in `alembic/versions/` to verify the logic.
4.  **Implement Downgrade**: Ensure the `downgrade()` function reverses the schema changes.

---

## 3. Production Deployment Pipeline

During production deployment:
1.  **Pre-Migration Backup**: Render triggers a database backup before starting the deployment.
2.  **Apply Migration**: The deployment runner executes:
    ```bash
    alembic upgrade head
    ```
3.  **Rollback Procedure**: If a migration fails or causes application errors, the database administrator executes a rollback:
    ```bash
    alembic downgrade -1
    ```
