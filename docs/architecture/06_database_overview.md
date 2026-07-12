# Database Overview: AssetFlow ERP

This document maps out the database schema, table structures, relationships, indexing strategies, and migration controls for the **AssetFlow ERP** system.

---

## 1. Database Configuration & Connection

AssetFlow is backed by a managed **PostgreSQL** instance hosted on Render (US Oregon Region).

*   **Database URL**: `postgresql://assetflow_db_xeh2_user:AA8yrgAidfIOHAq21OhEqOHKDcA6wXdG@dpg-d99gtpgk1i2s73e58va0-a.oregon-postgres.render.com/assetflow_db_xeh2`
*   **Security Notice**: The password and host are stored in environment variables (`DATABASE_URL`). The URL is parsed securely inside [database.py](file:///f:/coding/big_projects/assetflow/backend/app/core/database.py) using SQLAlchemy.
*   **Pooling Config**:
    *   `pool_size=10` (Maintain up to 10 persistent connections to minimize TCP handshake latency)
    *   `max_overflow=20` (Allow up to 20 temporary connections during peak loads)
    *   `pool_recycle=300` (Recycle connections older than 5 minutes to prevent stale sockets)

---

## 2. Entity-Relationship Diagram (ERD)

The database consists of five core tables modeling the complete asset lifecycle.

```mermaid
erDiagram
    USERS ||--o{ ASSETS : "created_by"
    CATEGORIES ||--o{ ASSETS : "classified_under"
    ASSETS ||--o{ ASSET_TRANSFERS : "transferred"
    ASSETS ||--o{ DEPRECIATIONS : "depreciated"
    ASSETS ||--o{ AUDIT_LOGS : "audited"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string role "admin | manager | accountant | viewer"
        boolean is_active
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        string name UK
        string description
        string depreciation_method "straight_line | double_declining"
        decimal standard_useful_life
    }

    ASSETS {
        uuid id PK
        string name
        string serial_number UK
        uuid category_id FK
        decimal purchase_cost
        timestamp purchase_date
        decimal salvage_value
        integer useful_life_years
        string status "active | in_maintenance | retired | transferred"
        uuid created_by FK
        timestamp created_at
    }

    ASSET_TRANSFERS {
        uuid id PK
        uuid asset_id FK
        string source_location
        string target_location
        uuid approved_by FK
        timestamp transfer_date
    }

    DEPRECIATIONS {
        uuid id PK
        uuid asset_id FK
        timestamp calculation_date
        decimal beginning_value
        decimal depreciation_amount
        decimal ending_value
        integer fiscal_year
    }

    AUDIT_LOGS {
        uuid id PK
        uuid asset_id FK
        string status "passed | failed | discrepancy"
        string notes
        timestamp audited_at
        uuid auditor_id FK
    }
```

---

## 3. Database Table Definitions

### 3.1 `users`
Tracks system users and their authentication roles.
-   `id`: `UUID` (Primary Key, default: `gen_random_uuid()`)
-   `email`: `VARCHAR(255)` (Unique, Indexed)
-   `hashed_password`: `VARCHAR(255)`
-   `full_name`: `VARCHAR(255)`
-   `role`: `VARCHAR(50)` (Constraint: Check constraint checking `'admin', 'manager', 'accountant', 'viewer'`)
-   `is_active`: `BOOLEAN`
-   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 3.2 `categories`
Groups assets and defines default depreciation parameters.
-   `id`: `UUID` (Primary Key)
-   `name`: `VARCHAR(100)` (Unique)
-   `description`: `TEXT`
-   `depreciation_method`: `VARCHAR(50)` (Constraint: `'straight_line', 'double_declining'`)
-   `standard_useful_life`: `DECIMAL(5, 2)` (Years)

### 3.3 `assets`
The core ledger for tracking items.
-   `id`: `UUID` (Primary Key)
-   `name`: `VARCHAR(255)`
-   `serial_number`: `VARCHAR(100)` (Unique, Indexed)
-   `category_id`: `UUID` (Foreign Key -> `categories.id`)
-   `purchase_cost`: `NUMERIC(15, 2)`
-   `purchase_date`: `TIMESTAMP WITH TIME ZONE`
-   `salvage_value`: `NUMERIC(15, 2)`
-   `useful_life_years`: `INTEGER`
-   `status`: `VARCHAR(50)` (Constraint: `'active', 'in_maintenance', 'retired', 'transferred'`)
-   `created_by`: `UUID` (Foreign Key -> `users.id`)
-   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 3.4 `depreciations`
Records values calculated over time.
-   `id`: `UUID` (Primary Key)
-   `asset_id`: `UUID` (Foreign Key -> `assets.id`, Cascades on Delete)
-   `calculation_date`: `TIMESTAMP WITH TIME ZONE`
-   `beginning_value`: `NUMERIC(15, 2)`
-   `depreciation_amount`: `NUMERIC(15, 2)`
-   `ending_value`: `NUMERIC(15, 2)`
-   `fiscal_year`: `INTEGER`

---

## 4. Indexing Strategy

To keep query performance under 10ms for active records, indexes are declared on foreign keys and commonly searched columns:

1.  **Unique / Search Indexes**:
    *   `idx_users_email` on `users(email)`
    *   `idx_assets_serial_number` on `assets(serial_number)`
2.  **Foreign Key Indexes** (Prevents table scans during joins):
    *   `idx_assets_category_id` on `assets(category_id)`
    *   `idx_depreciations_asset_id` on `depreciations(asset_id)`
    *   `idx_transfers_asset_id` on `asset_transfers(asset_id)`
3.  **Compound Operational Indexes**:
    *   `idx_depreciations_asset_year` on `depreciations(asset_id, fiscal_year)` (Speeds up historical depreciation retrieval).

---

## 5. Migration Strategy: Alembic

We manage database schema version control using **Alembic**.

*   **Rule 1: No direct schema modifications**. All database structural shifts must be executed through written Python migration scripts in `/backend/alembic/versions`.
*   **Rule 2: Automated generation**. Developers use `alembic revision --autogenerate -m "description"` to construct structural revisions.
*   **Rule 3: Downward migrations mandatory**. Every migration must contain both an `upgrade()` and a matching `downgrade()` function to support rollbacks.
