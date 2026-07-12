# Sprint Plan: AssetFlow ERP

This document contains the sprint-by-sprint development schedule for **AssetFlow ERP**, structured as **eight 2-week sprints**.

---

## 1. Sprint Schedule Matrix

---

### Sprint 1: Foundation & Security Setup
*   **Goal**: Establish the base codebase structure, database connection pooling, and authentication layers.
*   **Focus Area**: System architecture, JWT authentication, database schemas.
*   **Scope List**:
    *   Backend code scaffolding and SQLAlchemy database connections.
    *   JWT token generation and verification endpoints.
    *   Password hashing (bcrypt) and lockout policies.
    *   Frontend Vite project initialization and Tailwind configurations.
*   **Estimated Story Points**: **35 SP**.
*   **Key Deliverables**: A running FastAPI server that validates credentials and issues JWT tokens, and a React login page.
*   **Sprint Testing Target**: 100% test coverage on authentication helper functions.

---

### Sprint 2: User Profiles & Roles (RBAC)
*   **Goal**: Implement User, Department, and Role tables, and integrate role-checking route middleware.
*   **Focus Area**: Access control.
*   **Scope List**:
    *   Role and Permission database tables.
    *   FastAPI route check dependencies (`RoleChecker`).
    *   React Router navigation guards.
    *   Zustand `useAuthStore` global store.
*   **Estimated Story Points**: **30 SP**.
*   **Key Deliverables**: Protected routes showing a "403 Access Denied" page for unauthorized roles.

---

### Sprint 3: Asset Category & Locations
*   **Goal**: Create Category and Location registries.
*   **Focus Area**: Master data management.
*   **Scope List**:
    *   Category and Location tables with validations.
    *   API endpoints (CRUD) for locations and category properties.
    *   React UI pages for listing and adding locations and categories.
*   **Estimated Story Points**: **25 SP**.

---

### Sprint 4: Core Asset Catalog
*   **Goal**: Build the core Asset registry, search filters, and print layouts.
*   **Focus Area**: General inventory list.
*   **Scope List**:
    *   Assets database table with validations.
    *   API endpoints to list and create assets.
    *   React virtualized table directory.
    *   QR code generation.
*   **Estimated Story Points**: **40 SP**.
*   **Key Deliverables**: Asset Directory with working pagination, filters, and printable QR code tags.

---

### Sprint 5: Custody Allocations & Bookings
*   **Goal**: Implement long-term allocations and temporary bookings.
*   **Focus Area**: Resource scheduling.
*   **Scope List**:
    *   Asset Allocation and Booking database tables.
    *   PostgreSQL exclusion constraints to prevent overlapping bookings.
    *   React Calendar view for resource reservations.
*   **Estimated Story Points**: **35 SP**.

---

### Sprint 6: Depreciation calculations
*   **Goal**: Automate monthly depreciation runs using background jobs.
*   **Focus Area**: Accounting engine.
*   **Scope List**:
    *   Straight-Line and Double Declining depreciation calculators.
    *   Celery workers backed by Redis.
    *   Recharts visualization graphs on the dashboard.
*   **Estimated Story Points**: **40 SP**.

---

### Sprint 7: Compliance Auditing
*   **Goal**: Implement the physical inventory audit checklist.
*   **Focus Area**: Auditing, offline caching.
*   **Scope List**:
    *   Audit Cycles and Audit Results tables.
    *   Offline data storage (IndexedDB) for mobile scanning.
    *   Discrepancy report tickets.
*   **Estimated Story Points**: **35 SP**.

---

### Sprint 8: Reporting & Release
*   **Goal**: Export reports, run load tests, and configure production environments.
*   **Focus Area**: Operations, CI/CD.
*   **Scope List**:
    *   CSV/PDF export routes.
    *   Locust load testing.
    *   Docker configurations and automated Vercel/Render deployments.
*   **Estimated Story Points**: **30 SP**.
