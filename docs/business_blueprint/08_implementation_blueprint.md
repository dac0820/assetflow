# Implementation Blueprint: AssetFlow ERP

This document details the development phases, system priorities, risk register, and technical recommendations for the rollout of **AssetFlow ERP**.

---

## 1. Development Phases

We structure the implementation into five sequential development phases to manage project risks and build a stable foundation.

```
[Phase 1: Foundation] ──> [Phase 2: Core Assets] ──> [Phase 3: Financials]
                                                          │
                                                          ▼
[Phase 5: Integrations] <── [Phase 4: Auditing]
```

### Phase 1: Foundation & Identity (Weeks 1-3)
*   **Backend Goals**: Initialize the FastAPI codebase, configure Alembic migrations, set up SQLAlchemy connection pooling to the Render PostgreSQL instance, and implement JWT authentication and RBAC middleware.
*   **Frontend Goals**: Initialize Vite + TypeScript client, set up Tailwind CSS and the UI theme system (`shadcn/ui`), and build authentication pages (Login, Password Reset).

### Phase 2: Core Asset Registry (Weeks 4-6)
*   **Backend Goals**: Implement database tables for Assets, Categories, and Locations. Build CRUD endpoints with pagination, filtering, and validation rules.
*   **Frontend Goals**: Build the Asset Catalog interface, including search tools, filters, and forms to add and edit assets.
*   **Integrations**: Implement QR code generation.

### Phase 3: Financials & Allocations (Weeks 7-9)
*   **Backend Goals**: Create tables for Allocations and Depreciations. Implement Straight-Line and Double Declining depreciation calculators, and set up background tasks in Celery.
*   **Frontend Goals**: Build allocation forms, return logs, and dashboard charts showing depreciation schedules and asset valuations.

### Phase 4: Auditing & Inspections (Weeks 10-12)
*   **Backend Goals**: Implement the Audits database schema and endpoints to create checklists and log audit verification runs.
*   **Frontend Goals**: Build the Auditor dashboard, including audit schedulers and verification interfaces.

### Phase 5: Advanced Features & Integrations (Weeks 13-15)
*   **Backend Goals**: Integrate email alerts, file upload endpoints for receipts, and log webhooks for SAP/Oracle integrations.
*   **Frontend Goals**: Build user logs and general reports.

---

## 2. Implementation Priority (MoSCoW Matrix)

To focus our development efforts, we categorize requirements using the MoSCoW method:

### 2.1 Must Have (Critical for launch)
*   JWT authentication with secure HttpOnly cookie management.
*   Asset registry (CRUD) with serial number uniqueness.
*   Role-Based Access Control (Admin, Manager, Accountant, Viewer).
*   Relational database integrity on the Render PostgreSQL database.
*   Audit trail logs tracking data changes.

### 2.2 Should Have (High value additions)
*   Depreciation calculation engine (Straight-Line and Double Declining).
*   Exclusion constraints to prevent double-booking of shared resources.
*   Background workers (Celery + Redis) for heavy operations.
*   File attachments (receipts, warranties) for asset records.

### 2.3 Could Have (Nice to have)
*   Integrations with third-party Active Directory services.
*   Mobile layout optimization for field auditors.
*   Email alerts for overdue returns.

### 2.4 Won't Have (Excluded from initial scope)
*   IoT-enabled geofence trackers.
*   Native mobile apps (React Native builds).

---

## 3. Technical Recommendation Report

Based on project requirements, we recommend the following production stack:

1.  **Hosting Platform (Render)**:
    *   Deploy the FastAPI backend as a managed Web Service running Docker containers.
    *   Deploy the PostgreSQL database using Render's managed database service (US Oregon Region) with daily backups enabled.
    *   Deploy the React Vite frontend as a Render Static Site.
2.  **Database Strategy**:
    *   Keep transactional data in PostgreSQL. Use Alembic to version control all schema changes.
    *   Enforce database-level constraints (foreign keys, check constraints, unique indexes) to prevent data corruption.
3.  **Security Standards**:
    *   Require SSL connections to the database.
    *   Store environment variables (e.g., database connection string, JWT secrets) in Render's environment manager instead of hardcoding them in source control.
