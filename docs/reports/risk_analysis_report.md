# Risk Analysis Report: AssetFlow ERP

This report identifies the technical and operational risks associated with building **AssetFlow ERP** and defines our mitigation strategies.

---

## 1. Concurrency Risks: Simultaneous Asset Transfers

*   **Risk**: Two managers attempt to transfer or update the status of the same physical asset at the same time, leading to race conditions and inaccurate audit trails.
*   **Impact**: High. Can result in incorrect location data or double bookings.
*   **Mitigation Strategy**:
    *   Implement **Optimistic Locking** on the `assets` table. Add a `version_id` column (UUID or Integer) to the asset schema. Every update request must supply the version it read; if the database version has changed, the write is aborted, prompting the user to refresh their view.
    *   For critical actions (like auditing or final retirements), use **Pessimistic Locking** (`SELECT FOR UPDATE` in SQLAlchemy) to lock the asset record during the transaction lifecycle.

---

## 2. Performance Risks: Batch Depreciation Calculations

*   **Risk**: Calculating depreciation schedules for tens of thousands of assets simultaneously during financial close-out blocks the main API thread and exhausts database connections.
*   **Impact**: Medium-High. Can cause API timeouts for regular users.
*   **Mitigation Strategy**:
    *   **Offload processing**: Depreciation runs are handled asynchronously by **Celery worker containers** instead of the web server.
    *   **Batch processing**: Celery jobs execute calculations in batches (e.g., 500 assets per sub-task) using database transactions to avoid locking tables for extended periods.
    *   **Pre-computing**: Schedules are pre-computed on acquisition. When a user requests a valuation report, the system retrieves pre-calculated data rather than computing depreciation on the fly.

---

## 3. Deployment Risks: Schema Migration Lockups

*   **Risk**: Running database migrations on large tables (e.g., adding a non-nullable column without a default value) locks the database, causing downtime.
*   **Impact**: High. Prevents the application from reading or writing data.
*   **Mitigation Strategy**:
    *   **Safe Migration Steps**:
        1.  Add new columns as `NULLABLE`.
        2.  Run a background script to populate default data in batches.
        3.  Apply a `NOT NULL` constraint once the data is populated.
    *   **Staging Test**: Run migrations against a staging database (a replica of production data size) before running them in the production environment.

---

## 4. Security Risks: Sensitive Connection String Storage

*   **Risk**: The database connection string contains the production database credentials. Hardcoding this value or committing it to a public repository compromises the database.
*   **Impact**: Critical. Leads to data exposure or database deletion.
*   **Mitigation Strategy**:
    *   The connection string is kept out of source control. It is injected at runtime using Render Environment Variables.
    *   Our Git setup includes a `.gitignore` rule to prevent developer `.env` files from being committed.
    *   The provided Render URL is only included in the local `.env.example` template to clarify the connection format, and the production password is kept secure in Render's environment manager.
