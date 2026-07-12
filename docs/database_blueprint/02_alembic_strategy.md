# Alembic Migration Strategy: AssetFlow ERP

This document contains the Alembic migrations workflow, version naming rules, rollback strategies, and seed database scripts for **AssetFlow ERP**.

---

## 1. Migration Folder Layout & Conventions

All database schema migrations are managed under the `/backend/alembic/` directory.

```
backend/
├── alembic.ini                 # Base configuration file
└── alembic/
    ├── env.py                  # Database environment connection setup
    ├── script.py.mako          # Script generation template file
    └── versions/               # Individual version migration scripts
        ├── 202607120930_init.py
        └── 202607121020_add_warranty.py
```

### 1.1 Migration Naming Rules
To ensure migrations are sorted chronologically, the default Alembic identifier format is customized to use an epoch timestamp:
```ini
# alembic.ini
file_template = %%(year)d%%(month)02d%%(day)02d%%(hour)02d%%(minute)02d_%%(slug)s
```
*   **Example**: `202607120930_create_users_table.py`

---

## 2. Seed Data SQL Insertions

Below are the base seed scripts executed automatically during the initial migration run to initialize roles, permissions, and default administrative profiles.

```sql
-- Seed Core Roles
INSERT INTO roles (id, name, description, status) VALUES
('d1a60fae-e2c7-4ebc-8854-3252199b0c20', 'admin', 'System Administrator with full access rights', 'active'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c21', 'manager', 'Asset Manager responsible for operational registrations', 'active'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c22', 'accountant', 'Financial Officer who manages valuation runs', 'active'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c23', 'employee', 'General staff allocation recipient', 'active'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c24', 'technician', 'Maintenance Repair specialist', 'active'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c25', 'auditor', 'Compliance Auditor who runs physical cycle verification', 'active');

-- Seed Core Permissions
INSERT INTO permissions (id, code, description) VALUES
('f1ba9b21-4ea2-4e08-bf12-42171c69a101', 'user:create', 'Create user accounts'),
('f1ba9b21-4ea2-4e08-bf12-42171c69a102', 'asset:create', 'Register new inventory items'),
('f1ba9b21-4ea2-4e08-bf12-42171c69a103', 'finance:calculate', 'Run asset depreciation schedules');

-- Map Permissions to Roles (Admin maps to all permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
('d1a60fae-e2c7-4ebc-8854-3252199b0c20', 'f1ba9b21-4ea2-4e08-bf12-42171c69a101'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c20', 'f1ba9b21-4ea2-4e08-bf12-42171c69a102'),
('d1a60fae-e2c7-4ebc-8854-3252199b0c20', 'f1ba9b21-4ea2-4e08-bf12-42171c69a103');
```

---

## 3. Production Rollout & Rollback Strategy

To ensure zero-downtime upgrades and quick recovery:

1.  **Deployment Verification**:
    Before running migrations in production, the CI runner applies the migration to a staging database containing a clone of production data to verify schema changes.
2.  **Rollback Command**:
    If errors occur post-deployment, the database administrator runs the downgrade command to revert the last applied version:
    ```bash
    alembic downgrade -1
    ```
3.  **Mandatory Downgrade Function**:
    Every migration script must include a fully implemented `downgrade()` function to reverse the actions performed in `upgrade()` (e.g., dropping newly added columns).
